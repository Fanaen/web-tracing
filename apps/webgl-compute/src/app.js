
//
// Run chrome canary using the following flags:
// .\chrome.exe --use-cmd-decoder=passthrough --use-angle=gl --enable-webgl2-compute-context --use-gl=angle
//
// References:
// - https://www.khronos.org/registry/webgl/specs/latest/2.0-compute/
// - https://groups.google.com/a/chromium.org/forum/#!topic/blink-dev/bPD47wqY-r8/discussion
// - https://github.com/emscripten-core/emscripten/pull/7612
// - https://github.com/9ballsyndrome/WebGL_Compute_shader
// - https://www.khronos.org/webgl/wiki/Main_Page
//

var glm = require('glm-js');

class Renderer {
  constructor() {
    console.log('loaded glm-js version: ', glm.version);
    
    this.RENDER_SEED = 1000;
    this.SPP = 1;
    this.camera_position = glm.vec3(-2.9, -0.85, 14.0);
    this.camera_rotation = glm.vec3(-0.8, -6.8, 0.0);
    this.camera_fov = 40.0;
    this.frame_width = 500;
    this.frame_height = 250;
    this.spheres = [glm.vec4(0.0, 0.0, -1.0, 0.5)]
    this.vertices = [
      glm.vec3(0.0, 0.0, -5.0),
      glm.vec3(2.0, 1.0, -5.0),
      glm.vec3(0.0, 1.0, -5.0),
      glm.vec3(3.0, -1.0, -5.0),
      glm.vec3(5.0, -1.0, -5.0),
      glm.vec3(4.0, 2.0, -6.0),
      glm.vec3(-5.0, -1.0, 5.0),
      glm.vec3(5.0, -1.0, 5.0),
      glm.vec3(0.0, -1.0, -5.0),
    ];
    this.triangles = [
      0, 1, 2, 
      3, 4, 5, 
      6, 7, 8, 
      1, 3, 5,
      1, 0, 3,
      1, 5, 2,
    ];
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
        this.camera_position.x -= (new_mouse_pos.x - this.mouse_pos.x) * 0.005;
        this.camera_position.y += (new_mouse_pos.y - this.mouse_pos.y) * 0.005;
        this.mouse_pos = new_mouse_pos;

        this.render();
      }
      else if (this.mouse_down && !this.mouse_right)
      {
        const new_mouse_pos = glm.vec2(e.clientX, e.clientY);
        this.camera_rotation.y += (new_mouse_pos.x - this.mouse_pos.x) * 0.005;
        this.camera_rotation.x -= (new_mouse_pos.y - this.mouse_pos.y) * 0.002;
        this.mouse_pos = new_mouse_pos;

        this.render();
      }
    }

    document.addEventListener('wheel', (e) => {
      this.camera_position.z += e.deltaY * 0.005;
      this.render();
    });
  }

  create_scene_buffer(context)
  {
    // Create spheres buffer.
    const spheres_buffer = new Float32Array(this.spheres.length * 4);
    for (var i = 0, e = this.spheres.length; i < e; ++i)
    {
      const sphere = this.spheres[i];
      const gpuBufferIndex = i * 4;
      spheres_buffer[gpuBufferIndex] = sphere.x;
      spheres_buffer[gpuBufferIndex + 1] = sphere.y;
      spheres_buffer[gpuBufferIndex + 2] = sphere.z;
      spheres_buffer[gpuBufferIndex + 3] = sphere.w;
    }
    
    this.spheres_buffer_id = context.createBuffer();
    context.bindBuffer(context.SHADER_STORAGE_BUFFER, this.spheres_buffer_id);
    context.bufferData(context.SHADER_STORAGE_BUFFER, this.spheres.length * 4 * 4, context.STATIC_DRAW);
    context.bufferSubData(context.SHADER_STORAGE_BUFFER, 0, spheres_buffer);

    // Create vertices buffer.
    // We must pad to fit in vec4.
    // https://stackoverflow.com/questions/29531237/memory-allocation-with-std430-qualifier 
    const vertices_buffer = new Float32Array(this.vertices.length * 4);
    for (var i = 0, e = this.vertices.length; i < e; ++i)
    {
      const vertice = this.vertices[i];
      const gpuBufferIndex = i * 4;
      vertices_buffer[gpuBufferIndex] = vertice.x;
      vertices_buffer[gpuBufferIndex + 1] = vertice.y;
      vertices_buffer[gpuBufferIndex + 2] = vertice.z;
      vertices_buffer[gpuBufferIndex + 3] = 0.0;
    }
    
    this.vertices_buffer_id = context.createBuffer();
    context.bindBuffer(context.SHADER_STORAGE_BUFFER, this.vertices_buffer_id);
    context.bufferData(context.SHADER_STORAGE_BUFFER, this.vertices.length * 4 * 4, context.STATIC_DRAW);
    context.bufferSubData(context.SHADER_STORAGE_BUFFER, 0, vertices_buffer);

    // Create triangles buffer.
    this.triangles_buffer_id = context.createBuffer();
    context.bindBuffer(context.SHADER_STORAGE_BUFFER, this.triangles_buffer_id);
    context.bufferData(context.SHADER_STORAGE_BUFFER, this.triangles.length * 4, context.STATIC_DRAW);
    context.bufferSubData(context.SHADER_STORAGE_BUFFER, 0, new Int32Array(this.triangles));
  }

  bindBuffer(context, compute_program, buffer_id, layout_name)
  {
    let index = context.getProgramResourceIndex(compute_program, context.SHADER_STORAGE_BLOCK, layout_name);
    let bind = context.getProgramResource(compute_program, context.SHADER_STORAGE_BLOCK, index, [context.BUFFER_BINDING,])[0];
    context.bindBufferBase(context.SHADER_STORAGE_BUFFER, bind, buffer_id);
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

    // Create a buffer for the scene.
    this.create_scene_buffer(context);
    
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
    let camera_world_matrix = glm.mat4();
    camera_world_matrix = glm.rotate(camera_world_matrix, this.camera_rotation.y, glm.vec3(0.0, -1.0, 0.0));
    camera_world_matrix = glm.rotate(camera_world_matrix, this.camera_rotation.x, glm.vec3(1.0, 0.0, 0.0));
    camera_world_matrix = glm.translate(camera_world_matrix, this.camera_position);
      //* glm.rotate(glm.matthis.camera_rotation.x, glm.vec3(1.0, 0.0, 0.0));
      //* glm.rotate(this.camera_rotation.y, glm.vec3(0.0, 1.0, 0.0))
      //* glm.rotate(this.camera_rotation.z, glm.vec3(0.0, 0.0, 1.0));

    // Execute the ComputeShader.
    context.useProgram(computeProgram);
    this.bindBuffer(context, computeProgram, this.spheres_buffer_id, "Scene");
    this.bindBuffer(context, computeProgram, this.vertices_buffer_id, "Vertices");
    this.bindBuffer(context, computeProgram, this.triangles_buffer_id, "Triangles");
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