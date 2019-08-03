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
                    postMessage({ duration: (after - before).toFixed(1) });
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

                case 'create_or_edit_light':
                    renderingContext.create_or_edit_light(
                        call.id,
                        call.position.x,
                        call.position.y,
                        call.position.z,
                        call.intensity);
                    break;

                case 'remove_light':
                    renderingContext.remove_light(call.id);
                    break;

                case 'add_sphere':
                    renderingContext.add_sphere(
                        call.id,
                        call.position.x,
                        call.position.y,
                        call.position.z,
                        call.radius);

                    if (call.material.type === 'diffuse') {
                        renderingContext.set_lambert(
                            call.id,
                            call.material.albedo.r,
                            call.material.albedo.g,
                            call.material.albedo.b);
                    }

                    break;

                case 'update_sphere':
                    renderingContext.update_sphere(
                        call.id,
                        call.position.x,
                        call.position.y,
                        call.position.z,
                        call.radius);

                    if (call.material.type === 'diffuse') {
                        renderingContext.set_lambert(
                            call.id,
                            call.material.albedo.r,
                            call.material.albedo.g,
                            call.material.albedo.b);
                    }
                    break;

                case 'remove_sphere':
                    renderingContext.remove_sphere(call.id);
                    break;


                case 'add_triangle':
                    renderingContext.add_triangle(
                        call.id,
                        call.vertexA.x,
                        call.vertexA.y,
                        call.vertexA.z,
                        call.vertexB.x,
                        call.vertexB.y,
                        call.vertexB.z,
                        call.vertexC.x,
                        call.vertexC.y,
                        call.vertexC.z);

                    if (call.material.type === 'diffuse') {
                        renderingContext.set_lambert(
                            call.id,
                            call.material.albedo.r,
                            call.material.albedo.g,
                            call.material.albedo.b);
                    }

                    break;

                case 'update_triangle':
                    renderingContext.update_triangle(
                        call.id,
                        call.vertexA.x,
                        call.vertexA.y,
                        call.vertexA.z,
                        call.vertexB.x,
                        call.vertexB.y,
                        call.vertexB.z,
                        call.vertexC.x,
                        call.vertexC.y,
                        call.vertexC.z);

                    if (call.material.type === 'diffuse') {
                        renderingContext.set_lambert(
                            call.id,
                            call.material.albedo.r,
                            call.material.albedo.g,
                            call.material.albedo.b);
                    }
                    break;

                case 'remove_triangle':
                    renderingContext.remove_triangle(call.id);
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
