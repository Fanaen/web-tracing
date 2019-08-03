
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

const script = async () => {
  
  // Canvas setup.
  const canvas = document.querySelector("#glCanvas");
  const width = canvas.width = 2000;
  const height = canvas.height = 1000;
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
  //uniform mat4 trafo;

  // A ray.
  struct Ray {
    vec3 origin;
    vec3 direction;
  };

  //
  // Rendering procedures declarations.
  //

  vec3 color(Ray r);
  bool hit_sphere(vec3 center, float radius, Ray r);


  //
  // Rendering procedures definitions.
  //

  // Compute the color for a given ray.
  vec3 color(Ray r)
  {
    vec3 sphere_center = vec3(0.0, 0.0, -1.0);
    float sphere_radius = 0.5;

    if (hit_sphere(sphere_center, sphere_radius, r))
    {
      return vec3(1.0, 0.0, 0.0);
    }

    vec3 dir = normalize(r.direction);
    float t = 0.5 * (dir.y + 1.0);
    return (1.0 - t) * vec3(1.0, 1.0, 1.0) + t * vec3(0.5, 0.7, 1.0);
  }

  // Test intersection between a ray and a sphere.
  bool hit_sphere(vec3 center, float radius, Ray r)
  {
    vec3 oc = r.origin - center;
    float a = dot(r.direction, r.direction);
    float b = 2.0 * dot(oc, r.direction);
    float c = dot(oc, oc) - radius * radius;
    float discriminent = b * b - 4.0 * a * c;
    return discriminent > 0.0;
  }

  //
  // Main kernel.
  //

  void main() {
    // gl_LocalInvocationId: local index of the worker in its group.
    // gl_WorkGroupId : index of the current working group.
    // gl_WorkGroupSize : local size of a work group. here it is 16x16x1.
    // gl_GlovalInvocationId : global exectuion index of the current worker.
    // gl_GlobalInvocationId = gl_WorkGroupID * gl_WorkGroupSize + gl_LocalInvocationID

    ivec2 storePos = ivec2(gl_GlobalInvocationID.xy);
    ivec2 imageSize = ivec2(gl_NumWorkGroups.xy * gl_WorkGroupSize.xy);
    vec2 uv = vec2(storePos) / vec2(imageSize);

    // Configure a camera.
    vec3 lower_left_corner = vec3(-2.0, -1.0, -1.0);
    vec3 horizontal = vec3(4.0, 0.0, 0.0);
    vec3 vertical = vec3(0.0, 2.0, 0.0);
    vec3 origin = vec3(0.0, 0.0, 0.0);

    // Generate a camera ray.
    Ray r;
    r.origin = origin;
    r.direction = lower_left_corner + uv.x * horizontal + uv.y * vertical;

    // Shade the pixel.
    vec3 finalColor = color(r);

    // Write the pixel.
    imageStore(destTex, storePos, vec4(finalColor, 1.0));
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