import * as wasm from './wasm-module';

// Update the canvas
const canvas = document.getElementById('web-tracing-canvas');
let ctx = undefined;
if (canvas.getContext) {
    ctx = canvas.getContext('2d');
}

const fullscreenCanvas = document.getElementById('web-tracing-fullscreen-canvas');
let fullscreenCtx = undefined;
if (fullscreenCanvas.getContext) {
    fullscreenCtx = fullscreenCanvas.getContext('2d');
}

// -- UX --
// Update button
const drawButton = document.getElementById('draw-web-tracing');
drawButton.onclick = () => updateCanvas();

// Update on F4
document.onkeyup = function(e) {
    if (e.key === 'F9') {
        updateCanvas();
    }
    if (e.key === 'F4') {
        updateCanvas();
    }

    if (e.key === 'Escape') {
        toggleExpand();
    }
};

// Hide button
const webtracingData = document.getElementById('web-tracing-data');
const hideButton = document.getElementById('close-web-tracing');

const webtracingDisplayClass = webtracingData.className;
let isWebtracingDisplayVisible = true;

hideButton.onclick = () => {
    isWebtracingDisplayVisible = !isWebtracingDisplayVisible;
    webtracingData.className = webtracingDisplayClass + (isWebtracingDisplayVisible ? '' : ' hidden');
    hideButton.className = isWebtracingDisplayVisible ? 'btn fas fa-minus' : 'btn fas fa-plus'
};

// Expand button
const expandButton = document.getElementById('expand-web-tracing');
let isExpanded = false;
function toggleExpand() {
    isExpanded = !isExpanded;
    fullscreenCanvas.className = isExpanded ? '': 'hidden';
    webtracingData.className = isExpanded ? 'hidden': '';

    if(isExpanded) updateCanvas();
}

expandButton.onclick = () => toggleExpand();

let focused = true;

window.onfocus = function() {
    focused = true;
};
window.onblur = function() {
    focused = false;
};

const samplePerPixelInput = document.getElementById('sample-per-pixel');
const tileSizeInput = document.getElementById('tile-size');

// -- Path tracing --
function updateCanvas() {
    const currentCtx = isExpanded ? fullscreenCtx : ctx;
    const currentCanvas = isExpanded ? fullscreenCanvas : canvas;

    // Update the fullscreen size
    if(isExpanded) {
        fullscreenCanvas.width = document.body.clientWidth;
        fullscreenCanvas.height = document.body.clientHeight;
    }

    if (currentCtx) {
        wasm.setRenderingSettings({
            sample_per_pixel: parseInt(samplePerPixelInput.value)
        });
        const cameraEntity = document.getElementById('main-camera');
        wasm.setCamera(cameraEntity);
        wasm.draw(currentCtx, parseInt(tileSizeInput.value), currentCanvas.width, currentCanvas.height);
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
