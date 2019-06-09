import * as wasm from './wasm-module';

// Update the canvas
const canvas = document.getElementById('web-tracing-canvas');
let ctx = undefined;
if (canvas.getContext) {
    ctx = canvas.getContext('2d');
}

let focused = true;

window.onfocus = function() {
    focused = true;
};
window.onblur = function() {
    focused = false;
};

const samplePerPixelInput = document.getElementById('sample-per-pixel');
const tileSizeInput = document.getElementById('tile-size');

function updateCanvas() {
    if (ctx) {
        wasm.setRenderingSettings({
            sample_per_pixel: parseInt(samplePerPixelInput.value)
        });
        const cameraEntity = document.getElementById('main-camera');
        wasm.setCamera(cameraEntity);
        wasm.draw(ctx, parseInt(tileSizeInput.value), canvas.width, canvas.height);
    }
}

function realtimeUpdateCanvas() {
    if (focused) 
    {
        updateCanvas();
    }
    setTimeout(() => realtimeUpdateCanvas(), 1000);
}

//realtimeUpdateCanvas();
updateCanvas();

// -- UX --
// Update button
const drawButton = document.getElementById('draw-web-tracing');
drawButton.onclick = () => updateCanvas();

// Update on F4
document.onkeyup = function(e) {
    if (e.key === 'F9') {
        updateCanvas();
    }
};

// Hide button
const webtracingDisplay = document.getElementById('web-tracing-display');
const hideButton = document.getElementById('close-web-tracing');

const webtracingDisplayClass = webtracingDisplay.className;
let isWebtracingDisplayVisible = true;

hideButton.onclick = () => {
    isWebtracingDisplayVisible = !isWebtracingDisplayVisible;
    webtracingDisplay.className = webtracingDisplayClass + (isWebtracingDisplayVisible ? '' : ' hidden');
    hideButton.className = isWebtracingDisplayVisible ? 'btn fas fa-minus' : 'btn fas fa-plus'
};
