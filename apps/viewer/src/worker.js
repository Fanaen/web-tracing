const missedCalls = [];

onmessage = function(e) {
    missedCalls.push(e);
};

import('../../wasm-module/pkg').then(wasm => {
    console.log('Worker ready');
    let renderingContext = wasm.Context.new();

    function onMessageReceived(e) {
        try {
            const call = e.data;
            switch (call.type) {
                case 'draw':
                    const before = performance.now();
                    const image = renderingContext.draw(
                        call.tile_x,
                        call.tile_y,
                        call.tile_size,
                        call.width,
                        call.height);
                    const after = performance.now();

                    postMessage(image.buffer, [image.buffer]);
                    postMessage({ duration: after - before });
                    break;

                case 'set_camera':
                    renderingContext.camera_fov = call.fov;
                    renderingContext.camera_pos = wasm.Vector3.new(call.position.x, call.position.y, call.position.z);
                    renderingContext.camera_rotation = wasm.Vector3.new(call.rotation.x, call.rotation.y, call.rotation.z);
                    break;

                case 'set_rendering_settings':
                    if (call.sample_per_pixel)
                    {
                        renderingContext.sample_per_pixel = call.sample_per_pixel;
                    }
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
}).catch(e => {
    console.error('Error in worker', e);
});
