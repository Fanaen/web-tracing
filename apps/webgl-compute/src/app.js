
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

class Renderer {
  constructor() {
    this.RENDER_SEED = 1000;
    this.SPP = 1;
  }

  render() {
    // Canvas setup.
    const canvas = document.querySelector("#glCanvas");
    const width = canvas.width = 400;
    const height = canvas.height = 200;
    console.log("Canvas dimensions: ", width, height);
    
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
    
    // Create text texture for ComputeShader write to.
    const texture = context.createTexture();
    context.bindTexture(context.TEXTURE_2D, texture);
    context.texStorage2D(context.TEXTURE_2D, 1, context.RGBA8, width, height);
    context.bindImageTexture(0, texture, 0, false, 0, context.WRITE_ONLY, context.RGBA8);
    
    // Create frameBuffer to read from texture.
    const frameBuffer = context.createFramebuffer();
    context.bindFramebuffer(context.READ_FRAMEBUFFER, frameBuffer);
    context.framebufferTexture2D(context.READ_FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, texture, 0);
    
    // Execute the ComputeShader.
    context.useProgram(computeProgram);
    context.uniform1f(rngLoc, this.RENDER_SEED);
    context.uniform1i(sppLoc, this.SPP);
    context.dispatchCompute(width / 16, height / 16, 1);
    context.memoryBarrier(context.SHADER_IMAGE_ACCESS_BARRIER_BIT);

    // show computed texture to Canvas
    context.blitFramebuffer(
      0, 0, width, height,
      0, 0, width, height,
      context.COLOR_BUFFER_BIT, context.NEAREST);
  }
};

const script = async () => {
  let renderer = new Renderer();
  window.renderer = renderer;
  renderer.render();
};

window.addEventListener('DOMContentLoaded', script);