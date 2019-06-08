const nbWorkers = 4;

let frameId = 0;

// Stats stuff
let nbRays = 0;
let samplePerPixel = 1;

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

    clear() {
        this.queuedJobs = [];
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

        if (this.queuedJobs.length === 0) {
            // Frame complete, log the stats
            const perfEntryName = 'frame-#' + frameId;
            performance.measure(perfEntryName, perfEntryName);
            const frameTime = performance.getEntriesByName(perfEntryName)[1].duration;
            const frameTimeWithUnit = frameTime > 1000 ?
                (frameTime / 1000).toFixed(1) + 's' : frameTime.toFixed(1) + 'ms';

            logDrawIn(`Frame drawed in ${frameTimeWithUnit}`);
            logAppliedIn(`${Math.floor(nbRays / (frameTime / 1000)) } ray/s`)
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

        this.worker.postMessage(data);
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
            logAppliedIn(`Transfered and applied to canvas in ${(totalDuration - e.data.duration).toFixed(1)}ms`);

            setLoading(false);

            this.returnToIdle();
        }
    };

    returnToIdle() {
        this.isWorking = false;
        this.currentJob = undefined;
        this.ctx = undefined;
        this.parent.startNextJob();
    }
}

const workerPool = new WorkerPool(nbWorkers);

export function draw(ctx, tile_size, width, height) {
    workerPool.clear();

    // Stats stuff
    frameId++;
    performance.mark('frame-#' + frameId);

    nbRays = width * height * samplePerPixel;

    // Prepare the jobs
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

    if(settings.sample_per_pixel) {
        samplePerPixel = settings.sample_per_pixel;
    }

    workerPool.sendToEveryone(settings);
}
