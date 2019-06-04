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

    sendToEveryone(data) {
        for (const worker of this.workers) {
            worker.sendMessage(data);
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
        this.lastTileTime = null;
        this.lastTileBeginTime = null;
    }

    sendMessage(data)
    {
        this.worker.postMessage(data);
    }

    beginJob(id, data, ctx) {
        this.isWorking = true;
        setLoading(true);

        data.id = id;
        this.currentJob = data;
        this.ctx = ctx;

        performance.mark('tile-#' + id);

        if (useWasm) {
            this.worker.postMessage(JSON.stringify(data));
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
        if (e.data.byteLength) {
            // MESSAGE 1: tile octets
            // End of the drawing pipe, when using WASM
            const job = this.currentJob;

            const imageData = new ImageData(new Uint8ClampedArray(e.data), job.tile_size, job.tile_size);
            this.ctx.putImageData(imageData, job.tile_x, job.height - job.tile_size - job.tile_y, 0, 0, job.tile_size, job.tile_size);

            const perfEntryName = 'tile-#' + job.id;
            performance.measure(perfEntryName, perfEntryName);
        } else {
            // MESSAGE 2: metadata
            logDrawIn(`Drawed in ${e.data.duration}ms`);

            const perfEntryName = 'tile-#' + this.currentJob.id;
            const totalDuration = performance.getEntriesByName(perfEntryName)[1].duration;
            logAppliedIn(`Transfered and applied to canvas in ${totalDuration - e.data.duration}ms`);
            setLoading(false);

            this.returnToIdle();
        }
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

export function draw(ctx, tile_size, width, height) {
    for (let tile_y = 0; tile_y < height; tile_y += tile_size) {
        for (let tile_x = 0; tile_x < width; tile_x += tile_size) {
            const job = {
                type: 'draw',
                tile_x,
                tile_y,
                tile_size,
                width,
                height
            };

            workerPool.beginJob(job, ctx);
        }
    }
}

export function setCamera(cameraEntity) {
    const components = cameraEntity.components;
    const worldCameraObject = cameraEntity.object3D;
    const camera = components.camera.camera;
    const position = worldCameraObject.position;
    const rotation = worldCameraObject.rotation.toVector3();
    const fov = camera.fov;

    const message = {
        type: 'set_camera',
        position,
        rotation,
        fov
    };

    workerPool.sendToEveryone(message);
}

export function setRenderingSettings(settings) {
    settings.type = 'set_rendering_settings';
    workerPool.sendToEveryone(settings);
}