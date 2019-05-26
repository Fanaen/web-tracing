import * as wasm from '../../wasm-module/pkg/web_tracing';

wasm.greet()

const t0 = performance.now();
let result = 0;
for (let i = 0; i < 1000; i++) {
    result += wasm.benchmark(wasm.Vector3.new(0, 0, 0));
}
const t1 = performance.now();

console.log("Result: " + result + " (" + ((t1 - t0)/1000) + " millisecondess)");
