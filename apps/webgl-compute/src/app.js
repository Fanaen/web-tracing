
//
// References:
// - https://www.khronos.org/registry/webgl/specs/latest/2.0-compute/
// - https://groups.google.com/a/chromium.org/forum/#!topic/blink-dev/bPD47wqY-r8/discussion
// - https://github.com/emscripten-core/emscripten/pull/7612
// - https://github.com/9ballsyndrome/WebGL_Compute_shader
//

const script = async () => {
  
  // Canvas setup.
  const canvas = document.querySelector("#glCanvas");
  const width = canvas.width = window.innerWidth;
  const height = canvas.height = window.innerHeight;
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
  const computeShaderSource = `#version 310 es
  layout (local_size_x = 16, local_size_y = 16, local_size_z = 1) in;
  layout (rgba8, binding = 0) writeonly uniform highp image2D destTex;
  void main() {
    ivec2 storePos = ivec2(gl_GlobalInvocationID.xy);
    imageStore(destTex, storePos, vec4(vec2(gl_WorkGroupID.xy) / vec2(gl_NumWorkGroups.xy), 0.0, 1.0));
  }
  `;

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
  context.dispatchCompute(width / 16, height / 16, 1);
  context.memoryBarrier(context.SHADER_IMAGE_ACCESS_BARRIER_BIT);

  // show computed texture to Canvas
  context.blitFramebuffer(
    0, 0, width, height,
    0, 0, width, height,
    context.COLOR_BUFFER_BIT, context.NEAREST);
};

window.addEventListener('DOMContentLoaded', script);