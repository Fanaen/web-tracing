const missedCalls = [];

onmessage = function(e) {
    missedCalls.push(e);
};

import('../../wasm-module/pkg').then(wasm => {
    console.log('Worker ready');

    function onMessageReceived(e) {
        const call = e.data;
        switch (call.type) {
            case 'draw':
                console.log('Started drawing');
                draw(call.id, call.width, call.height, call.camera_pos, call.camera_rotation, call.camera_fov)
                break;
        }
    }

    onmessage = onMessageReceived;

    for (const missedCall of missedCalls) {
        onMessageReceived(missedCall);
    }

    function draw(id, width, height, cameraPos, cameraRotation, cameraFov) {
        // Call the WASM
        const cameraPosVector = wasm.Vector3.new(cameraPos.x, cameraPos.y, cameraPos.z);
        const cameraRotationVector = wasm.Vector3.new(cameraRotation.x, cameraRotation.y, cameraRotation.z);

        const before = performance.now();
        const image = wasm.draw(width, height, cameraPosVector, cameraRotationVector, cameraFov);
        const after = performance.now();
        const time = (after - before).toFixed(3);
        postMessage({ image: new Uint8ClampedArray(image), time, id, timestamp: performance.now() });
    }
});
