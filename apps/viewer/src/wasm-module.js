import axios from 'axios';

let useWasm = true;
const serverUrl = 'http://localhost:8000';

// Initialise worker stuff
const worker = new Worker('./worker.js');
let workerJobs = [];
let lastWorkerChunkId = 0;

function popJob(id) {
    for (let i = 0; i < workerJobs.length; i++) {
        if (workerJobs[i].id === id) {
            const job = workerJobs[i];
            workerJobs = workerJobs.splice(i, 1);
            return job;
        }
    }
}
worker.onmessage = function(e) {
    logDrawIn(`Drawed in ${e.data.time}ms`);

    const job = popJob(e.data.id);
    if (!job) {
        console.error(`Impossible to found job for id ${e.data.id}`);
        setLoading(false);
        return;
    }

    const imageData = new ImageData(e.data.image, job.width, job.height);
    job.ctx.putImageData(imageData, 0, 0, 0, 0, job.width, job.height);
    const after = performance.now();
    setLoading(false);
    logAppliedIn(`Transfered and applied to canvas in ${(after - e.data.timestamp).toFixed(3)}ms`);
};


function logDrawIn(str) {
    console.log(str);
    document.getElementById('draw-in').innerText = str;
}
function logAppliedIn(str) {
    console.log(str);
    document.getElementById('applied-in').innerText = str;
}

const webLoadingDisplay = document.getElementById('web-tracing-display');
function setLoading(active) {
    webLoadingDisplay.className = active ? 'loading' : '';
}

function draw(ctx, width, height, camera_pos, camera_rotation, camera_fov) {
    const data = { type: 'draw', width, height, camera_pos, camera_rotation, camera_fov };

    if (useWasm) {
        setLoading(true);
        const job = {
            id: lastWorkerChunkId++,
            width,
            height,
            ctx
        };

        workerJobs.push(job);
        data.id = job.id;

        worker.postMessage(data);

    } else {
        // Call the server
        setLoading(true);
        axios
            .post(`${serverUrl}/draw`, data, { headers: { 'Access-Control-Allow-Origin': '*' } })
            .then(response => {
                logDrawIn(`Drawed in ${response.data.time}`);

                const before = performance.now();
                const imageData = ctx.createImageData(width, height);
                const image = response.data.image;

                for (let i = 0; i< image.length; i++) {
                    imageData.data[i] = image[i];
                }

                ctx.putImageData(imageData, 0, 0, 0, 0, width, height);
                const after = performance.now();
                setLoading(false);
                logAppliedIn(`Applied to canvas in ${(after - before).toFixed(3)}ms`);

            })
            .catch(error => console.error('Error when calling draw:', error)); // Print the error if one occurred;
    }
}

export {
    draw
}