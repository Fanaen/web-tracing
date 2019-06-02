import axios from 'axios';

const useWasm = true;
const nbWorkers = 4;
const serverUrl = 'http://localhost:8000';

// UX stuff
function logDrawIn(str) {
    document.getElementById('draw-in').innerText = str;
}
function logAppliedIn(str) {
    document.getElementById('applied-in').innerText = str;
}

const webLoadingDisplay = document.getElementById('web-tracing-display');
function setLoading(active) {
    webLoadingDisplay.className = active ? 'loading' : '';
}

// Initialise worker stuff
class WorkerPool {
    constructor(nbWorkers) {
        this.workers = [];
        this.queuedJobs = [];
        this.lastWorkerChunkId = 0;

        for (let i = 0; i < nbWorkers; i++) {
            this.workers.push(new WebTracingWorker(i, this));
        }
    }

    getIdleWorker() {
        for (const worker of this.workers) {
            if (!worker.isWorking) {
                return worker;
            }
        }

        return undefined;
    }

    beginJob(data, ctx) {
        const worker = this.getIdleWorker();
        if (worker) {
            worker.beginJob(this.lastWorkerChunkId++, data, ctx);
        } else {
            this.queuedJobs.push({ id: this.lastWorkerChunkId++, data, ctx });
        }
    }

    startNextJob() {
        let worker = this.getIdleWorker();
        while(worker && this.queuedJobs.length > 0) {
            const job = this.queuedJobs.shift();
            worker.beginJob(job.id, job.data, job.ctx);

            worker = this.getIdleWorker();
        }
    }
}

class WebTracingWorker {
    constructor(id, pool) {
        this.id = id;
        this.worker = new Worker('./worker.js');
        this.worker.onmessage = (e) => this.onMessage(e);
        this.parent = pool;
        this.currentJob = undefined;
        this.isWorking = false;
    }

    beginJob(id, data, ctx) {
        this.isWorking = true;
        setLoading(true);

        data.id = id;
        this.currentJob = data;
        this.ctx = ctx;

        if (useWasm) {
            this.worker.postMessage(data);
        } else {
            // Call the server
            setLoading(true);
            axios
                .post(`${serverUrl}/draw`, data, { headers: { 'Access-Control-Allow-Origin': '*' } })
                .then(response => {
                    // End of the drawing pipe, when using server
                    logDrawIn(`Drawed in ${response.data.time}`);

                    const before = performance.now();
                    const imageData = ctx.createImageData(data.tile_size, data.tile_size);
                    const image = response.data.image;

                    for (let i = 0; i< image.length; i++) {
                        imageData.data[i] = image[i];
                    }

                    ctx.putImageData(imageData, data.tile_x, data.height - data.tile_size - data.tile_y, 0, 0, data.tile_size, data.tile_size);
                    const after = performance.now();
                    setLoading(false);
                    logAppliedIn(`Applied to canvas in ${(after - before).toFixed(3)}ms`);

                    this.returnToIdle();
                })
                .catch(error => console.error('Error when calling draw:', error)); // Print the error if one occurred;
        }
    }

    onMessage(e) {
        // End of the drawing pipe, when using WASM
        logDrawIn(`Drawed in ${e.data.time}ms`);
        const job = this.currentJob;

        const imageData = new ImageData(e.data.image, job.tile_size, job.tile_size);
        this.ctx.putImageData(imageData, job.tile_x, job.height - job.tile_size - job.tile_y, 0, 0, job.tile_size, job.tile_size);
        const after = performance.now();
        setLoading(false);
        logAppliedIn(`Transfered and applied to canvas in ${(after - e.data.timestamp).toFixed(3)}ms`);

        this.returnToIdle();
    };

    returnToIdle() {
        this.isWorking = false;
        this.currentJob = undefined;
        this.currentJobId = undefined;
        this.ctx = undefined;
        this.parent.startNextJob();
    }
}

const workerPool = new WorkerPool(nbWorkers);

const draw = (ctx, tile_size, width, height, camera_pos, camera_rotation, camera_fov) => {
    for (let tile_y = 0; tile_y < height; tile_y += tile_size) {
        for (let tile_x = 0; tile_x < width; tile_x += tile_size) {
            const job = {
                type: 'draw',
                tile_x,
                tile_y,
                tile_size,
                width,
                height,
                camera_pos,
                camera_rotation,
                camera_fov,
            };

            workerPool.beginJob(job, ctx);
        }
    }
};

export {
    draw
}