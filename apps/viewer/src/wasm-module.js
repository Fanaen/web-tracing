import * as wasm from '../../wasm-module/pkg/web_tracing';
import axios from 'axios';

let useWasm = true;
const serverUrl = 'http://localhost:8000';


function draw(ctx, width, height, cameraPos, cameraRotation, cameraFov) {
    if (useWasm) {
        // Call the WASM
        const cameraPosVector = wasm.Vector3.new(cameraPos.x, cameraPos.y, cameraPos.z);
        const cameraRotationVector = wasm.Vector3.new(cameraRotation.x, cameraRotation.y, cameraRotation.z);

        const before = performance.now();
        wasm.draw(ctx, width, height, cameraPosVector, cameraRotationVector, cameraFov);
        const after = performance.now();
        console.log(`Draw in ${(after - before).toFixed(3)}ms`);
    } else {
        // Call the server
        axios.post(`${serverUrl}/draw`, {
            width,
            height,
            camera_pos: cameraPos,
            camera_rotation: cameraRotation,
            camera_fov: cameraFov
        }, {
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
        })
        .then(response => {
            console.log(`Draw in ${response.data.time}`);

            const before = performance.now();
            const imageData = ctx.createImageData(width, height);
            const image = response.data.image;

            for (let i = 0; i< image.length; i++) {
                imageData.data[i] = image[i];
            }

            ctx.putImageData(imageData, 0, 0, 0, 0, width, height);
            const after = performance.now();
            console.log(`Applied to canvas in ${(after - before).toFixed(3)}ms`);

        })
        .catch(error => console.error('Error when calling draw:', error)); // Print the error if one occurred;
    }
}

export {
    draw
}