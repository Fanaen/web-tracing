import * as wasm from '../../wasm-module/pkg/web_tracing';

const t0 = performance.now();
let result = 0;
for (let i = 0; i < 1000; i++) {
    result += wasm.benchmark(wasm.Vector3.new(0, 0, 0));
}
const t1 = performance.now();

console.log("Result: " + result + " (" + ((t1 - t0)/1000) + " millisecondes)");

// Test the canvas
const canvas = document.getElementById('web-tracing-canvas');
if (canvas.getContext) {
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgb(200, 0, 0)';
    ctx.fillRect(10, 10, 50, 50);

    ctx.fillStyle = 'rgba(0, 0, 200, 0.5)';
    ctx.fillRect(30, 30, 50, 50);
}

// -- UX --
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