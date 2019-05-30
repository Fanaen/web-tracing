import * as wasm from '../../wasm-module/pkg/web_tracing';

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

function updateCanvas() {
    if (ctx) {
        const camera = document.getElementById('main-camera').components;
        console.log(camera);
        const cameraPos = wasm.Vector3.new(camera.position.data.x, camera.position.data.y, camera.position.data.z);
        const cameraRotation = wasm.Vector3.new(camera.rotation.data.x, camera.rotation.data.y, camera.rotation.data.z);
        console.log(camera.position.data);
        console.log(camera.rotation.data);
        wasm.draw(ctx, 320, 160, cameraPos, cameraRotation, camera.camera.camera.fov);
    }
}

function realtimeUpdateCanvas() {
    if (focused) 
    {
        updateCanvas();
    }
    setTimeout(() => realtimeUpdateCanvas(), 5000);
}

realtimeUpdateCanvas();

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
