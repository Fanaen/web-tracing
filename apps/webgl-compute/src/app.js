
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
  
  // Create WebGL2ComputeRenderingContext
  const context = canvas.getContext('webgl2-compute');
  if (!context) {
    console.error("Cannot start webgl2 compute context.");
    return;
  }

  console.log("webgl2 compute context started correctly.");
  
  // ComputeShader source
  // language=GLSL
  const computeShaderSource = `#version 310 es
    layout (local_size_x = 8, local_size_y = 1, local_size_z = 1) in;
    layout (std430, binding = 0) buffer SSBO {
      float data[];
    } ssbo;
    
    void main() {
      uint threadIndex = gl_GlobalInvocationID.x;
      ssbo.data[threadIndex] = float(threadIndex);
    }
  `;
  // create WebGLShader for ComputeShader
  const computeShader = context.createShader(context.COMPUTE_SHADER);
  context.shaderSource(computeShader, computeShaderSource);
  context.compileShader(computeShader);
  if (!context.getShaderParameter(computeShader, context.COMPILE_STATUS)) {
    console.log(context.getShaderInfoLog(computeShader));
    return;
  }

  // create WebGLProgram for ComputeShader
  const computeProgram = context.createProgram();
  context.attachShader(computeProgram, computeShader);
  context.linkProgram(computeProgram);
  if (!context.getProgramParameter(computeProgram, context.LINK_STATUS)) {
    console.log(context.getProgramInfoLog(computeProgram));
    return;
  }

  // input data
  const input = new Float32Array(8);
  console.log("Input");
  console.log(input);

  // create ShaderStorageBuffer
  const ssbo = context.createBuffer();
  context.bindBuffer(context.SHADER_STORAGE_BUFFER, ssbo);
  context.bufferData(context.SHADER_STORAGE_BUFFER, input, context.DYNAMIC_COPY);
  context.bindBufferBase(context.SHADER_STORAGE_BUFFER, 0, ssbo);

  // execute ComputeShader
  context.useProgram(computeProgram);
  context.dispatchCompute(1, 1, 1);

  // get result
  const result = new Float32Array(8);
  context.getBufferSubData(context.SHADER_STORAGE_BUFFER, 0, result);
  console.log("Output");
  console.log(result);
};

window.addEventListener('DOMContentLoaded', script);