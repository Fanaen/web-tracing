const missedCalls = [];

onmessage = function(e) {
    missedCalls.push(e);
};

import('../../wasm-module/pkg').then(wasm => {
    console.log('Worker ready');

    function onMessageReceived(e) {
        try {
            const call = e.data;
            switch (call.type) {
                case 'draw':
                    console.log(`Started drawing tile #${call.id}`);
                    // Call the WASM
                    const cameraPosVector = wasm.Vector3.new(call.camera_pos.x, call.camera_pos.y, call.camera_pos.z);
                    const cameraRotationVector = wasm.Vector3.new(call.camera_rotation.x, call.camera_rotation.y, call.camera_rotation.z);

                    const before = performance.now();
                    const image = wasm.draw(
                        call.tile_x,
                        call.tile_y,
                        call.tile_size,
                        call.width,
                        call.height,
                        cameraPosVector,
                        cameraRotationVector,
                        call.camera_fov);
                    const after = performance.now();
                    const time = (after - before).toFixed(3);
                    postMessage({ image: new Uint8ClampedArray(image), time, id: call.id, timestamp: performance.now() });
                    break;
            }
        } catch(e) {
            console.error('Error in worker', e);
        }
    }

    onmessage = onMessageReceived;

    for (const missedCall of missedCalls) {
        onMessageReceived(missedCall);
    }
});
