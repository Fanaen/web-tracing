
//
// Run chrome canary using the following flags:
// .\chrome.exe --use-cmd-decoder=passthrough --use-angle=gl --enable-webgl2-compute-context --use-gl=angle
//
// References:
// - https://www.khronos.org/registry/webgl/specs/latest/2.0-compute/
// - https://groups.google.com/a/chromium.org/forum/#!topic/blink-dev/bPD47wqY-r8/discussion
// - https://github.com/emscripten-core/emscripten/pull/7612
// - https://github.com/9ballsyndrome/WebGL_Compute_shader
//

var glm = require('glm-js');

class Renderer {
  constructor() {
    console.log('loaded glm-js version: ', glm.version);
    
    this.RENDER_SEED = 1000;
    this.SPP = 1;
    this.camera_position = glm.vec3(-0.0, -0.0, 3.0);
    this.camera_rotation = glm.vec3(0.0, 180.0, 0.0);
    this.camera_fov = 40.0;
    this.frame_width = 500;
    this.frame_height = 250;
  }

  attach_mouse_events(document) {
    this.mouse_down = false;
    this.mouse_right = false;
    this.mouse_pos = glm.vec2(0.0);

    document.addEventListener('mousedown', (e) => {
      this.mouse_down = true;
      this.mouse_right = e.button === 2;
      this.mouse_pos = glm.vec2(e.clientX, e.clientY);
    });

    document.addEventListener('mouseup', (e) => {
      this.mouse_down = false;
      this.mouse_right = false;
    });

    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    document.onmousemove = (e) => {
      if (this.mouse_down && this.mouse_right)
      {
        const new_mouse_pos = glm.vec2(e.clientX, e.clientY);
        this.camera_position.x += (new_mouse_pos.x - this.mouse_pos.x) * 0.005;
        this.camera_position.y -= (new_mouse_pos.y - this.mouse_pos.y) * 0.005;
        this.mouse_pos = new_mouse_pos;

        this.render();
      }
    }

    document.addEventListener('wheel', (e) => {
      this.camera_fov += e.deltaY * 0.01;
      this.render();
    });
  }

  render() {
    // Canvas setup.
    const canvas = document.querySelector("#glCanvas");
    canvas.width = this.frame_width;
    canvas.height = this.frame_height;
    
    // Create WebGL2ComputeRenderingContext
    const context = canvas.getContext('webgl2-compute', { antialias: false });
    if (!context) {
      console.error("Cannot start webgl2 compute context.");
      return;
    }

    console.log("webgl2 compute context started correctly.");
    
    // ComputeShader source
    // language=GLSL
    const computeShaderSource = require('./glsl/compute.glsl');

    // Create WebGLShader for ComputeShader.
    const computeShader = context.createShader(context.COMPUTE_SHADER);
    context.shaderSource(computeShader, computeShaderSource);
    context.compileShader(computeShader);
    if (!context.getShaderParameter(computeShader, context.COMPILE_STATUS)) {
      console.error(context.getShaderInfoLog(computeShader));
      return;
    }

    // Create WebGLProgram for ComputeShader.
    const computeProgram = context.createProgram();
    context.attachShader(computeProgram, computeShader);
    context.linkProgram(computeProgram);
    if (!context.getProgramParameter(computeProgram, context.LINK_STATUS)) {
      console.error(context.getProgramInfoLog(computeProgram));
      return;
    }

    // Configure uniforms.
    const rngLoc = context.getUniformLocation(computeProgram, "uInitialSeed");
    const sppLoc = context.getUniformLocation(computeProgram, "uSamplesPerPixel");
    const cameraToWordLoc = context.getUniformLocation(computeProgram, "uCameraToWorld");
    const cameraInverseProjectionLoc = context.getUniformLocation(computeProgram, "uCameraInverseProjection");
    
    // Create text texture for ComputeShader write to.
    const texture = context.createTexture();
    context.bindTexture(context.TEXTURE_2D, texture);
    context.texStorage2D(context.TEXTURE_2D, 1, context.RGBA8, this.frame_width, this.frame_height);
    context.bindImageTexture(0, texture, 0, false, 0, context.WRITE_ONLY, context.RGBA8);
    
    // Create frameBuffer to read from texture.
    const frameBuffer = context.createFramebuffer();
    context.bindFramebuffer(context.READ_FRAMEBUFFER, frameBuffer);
    context.framebufferTexture2D(context.READ_FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, texture, 0);

    // Configure the camera.
    const camera_perspective = glm.perspective(glm.radians(this.camera_fov), this.frame_width / this.frame_height, 0.1, 100.0);
    const inverse_camera_perspective = glm.inverse(camera_perspective);
    const camera_world_matrix = glm.translate(glm.mat4(), this.camera_position);
      //* glm.rotate(this.camera_rotation.x, glm.vec3(1.0, 0.0, 0.0))
      //* glm.rotate(this.camera_rotation.y, glm.vec3(0.0, 1.0, 0.0))
      //* glm.rotate(this.camera_rotation.z, glm.vec3(0.0, 0.0, 1.0));

    // Execute the ComputeShader.
    context.useProgram(computeProgram);
    context.uniform1f(rngLoc, this.RENDER_SEED);
    context.uniform1i(sppLoc, this.SPP);
    context.uniformMatrix4fv(cameraInverseProjectionLoc, false, inverse_camera_perspective.elements);
    context.uniformMatrix4fv(cameraToWordLoc, false, camera_world_matrix.elements);
    context.dispatchCompute(this.frame_width / 16, this.frame_height / 16, 1);
    context.memoryBarrier(context.SHADER_IMAGE_ACCESS_BARRIER_BIT);

    // show computed texture to Canvas
    context.blitFramebuffer(
      0, 0, this.frame_width, this.frame_height,
      0, 0, this.frame_width, this.frame_height,
      context.COLOR_BUFFER_BIT, context.NEAREST);
  }
};

const script = async () => {
  let renderer = new Renderer();
  window.renderer = renderer;
  renderer.attach_mouse_events(window.document);
  renderer.render();
};

window.addEventListener('DOMContentLoaded', script);