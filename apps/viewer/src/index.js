import * as wasm from '../../wasm-module/pkg/web_tracing';

const t0 = performance.now();
let result = 0;
for (let i = 0; i < 1000; i++) {
    result += wasm.benchmark(wasm.Vector3.new(0, 0, 0));
}
const t1 = performance.now();

console.log("Result: " + result + " (" + ((t1 - t0)/1000) + " millisecondes)");

// Update the canvas
const canvas = document.getElementById('web-tracing-canvas');
let ctx = undefined;
if (canvas.getContext) {
    ctx = canvas.getContext('2d');
}
function updateCanvas() {
    if (ctx) {
        const camera = document.getElementById('main-camera').components;
        console.log(camera);
        const cameraPos = wasm.Vector3.new(camera.position.data.x, camera.position.data.y, camera.position.data.z);
        wasm.draw(ctx, 320, 160, cameraPos);
    }
}
updateCanvas();

// -- UX --
// Update button
const drawButton = document.getElementById('draw-web-tracing');
drawButton.onclick = () => updateCanvas();

// Update on F4
document.onkeyup = function(e) {
    if (e.key === 'F4') {
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
