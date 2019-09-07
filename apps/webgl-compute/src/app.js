
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

import { object_verticies, object_triangles } from './bunny.js';

class Renderer {
  constructor() {
    console.log('loaded glm-js version: ', glm.version);

    this.RENDER_SEED = 1000;
    this.SPP = 1;
    this.camera_position = glm.vec3(-3.01, -0.53, 6.5);
    this.camera_rotation = glm.vec3(0.98, -6.4, 0.0);
    this.camera_fov = 40.0;
    this.frame_width = 500;
    this.frame_height = 250;
  }

  init() {
    // Canvas setup.
    const canvas = document.querySelector("#glCanvas");
    canvas.width = this.frame_width;
    canvas.height = this.frame_height;

    // Create WebGL2ComputeRenderingContext
    this.context = canvas.getContext('webgl2-compute', { antialias: false });
    if (!this.context) {
      console.error("Cannot start webgl2 compute context.");
      return;
    }

    // Create a buffer for the scene.
    this.create_scene_buffer(this.context);
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
    // Create vertices buffer.
    // We must pad to fit in vec4.
    // https://stackoverflow.com/questions/29531237/memory-allocation-with-std430-qualifier 
    const vertices_buffer = new Float32Array(object_verticies.length / 3 * 4);

    for (var i = 0, e = object_verticies.length, gpu_i = 0; i < e; i += 3)
    {
      vertices_buffer[gpu_i++] = object_verticies[i];
      vertices_buffer[gpu_i++] = object_verticies[i + 1];
      vertices_buffer[gpu_i++] = object_verticies[i + 2];
      vertices_buffer[gpu_i++] = 0.0;
    }
    
    this.vertices_buffer_id = context.createBuffer();
    context.bindBuffer(context.SHADER_STORAGE_BUFFER, this.vertices_buffer_id);
    context.bufferData(context.SHADER_STORAGE_BUFFER, vertices_buffer.length * 4, context.STATIC_DRAW);
    context.bufferSubData(context.SHADER_STORAGE_BUFFER, 0, vertices_buffer);

    // Create triangles buffer.
    this.triangles_buffer_id = context.createBuffer();
    context.bindBuffer(context.SHADER_STORAGE_BUFFER, this.triangles_buffer_id);
    context.bufferData(context.SHADER_STORAGE_BUFFER, object_triangles.length * 4, context.STATIC_DRAW);
    context.bufferSubData(context.SHADER_STORAGE_BUFFER, 0, new Int32Array(object_triangles));
  }

  bindBuffer(context, compute_program, buffer_id, layout_name)
  {
    let index = context.getProgramResourceIndex(compute_program, context.SHADER_STORAGE_BLOCK, layout_name);
    let bind = context.getProgramResource(compute_program, context.SHADER_STORAGE_BLOCK, index, [context.BUFFER_BINDING,])[0];
    context.bindBufferBase(context.SHADER_STORAGE_BUFFER, bind, buffer_id);
  }

  render() {
    if (!this.context) {
      return;
    }

    // ComputeShader source
    // language=GLSL
    const computeShaderSource = require('./glsl/compute.glsl');

    // Create WebGLShader for ComputeShader.
    const computeShader = this.context.createShader(this.context.COMPUTE_SHADER);
    this.context.shaderSource(computeShader, computeShaderSource);
    this.context.compileShader(computeShader);
    if (!this.context.getShaderParameter(computeShader, this.context.COMPILE_STATUS)) {
      console.error(this.context.getShaderInfoLog(computeShader));
      return;
    }

    // Create WebGLProgram for ComputeShader.
    const computeProgram = this.context.createProgram();
    this.context.attachShader(computeProgram, computeShader);
    this.context.linkProgram(computeProgram);
    if (!this.context.getProgramParameter(computeProgram, this.context.LINK_STATUS)) {
      console.error(this.context.getProgramInfoLog(computeProgram));
      return;
    }

    // Configure uniforms.
    const rngLoc = this.context.getUniformLocation(computeProgram, "uInitialSeed");
    const sppLoc = this.context.getUniformLocation(computeProgram, "uSamplesPerPixel");
    const cameraToWordLoc = this.context.getUniformLocation(computeProgram, "uCameraToWorld");
    const cameraInverseProjectionLoc = this.context.getUniformLocation(computeProgram, "uCameraInverseProjection");
    
    // Create text texture for ComputeShader write to.
    const texture = this.context.createTexture();
    this.context.bindTexture(this.context.TEXTURE_2D, texture);
    this.context.texStorage2D(this.context.TEXTURE_2D, 1, this.context.RGBA8, this.frame_width, this.frame_height);
    this.context.bindImageTexture(0, texture, 0, false, 0, this.context.WRITE_ONLY, this.context.RGBA8);
    
    // Create frameBuffer to read from texture.
    const frameBuffer = this.context.createFramebuffer();
    this.context.bindFramebuffer(this.context.READ_FRAMEBUFFER, frameBuffer);
    this.context.framebufferTexture2D(this.context.READ_FRAMEBUFFER, this.context.COLOR_ATTACHMENT0, this.context.TEXTURE_2D, texture, 0);

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
    this.context.useProgram(computeProgram);
    //this.bindBuffer(this.context, computeProgram, this.spheres_buffer_id, "Scene");
    this.bindBuffer(this.context, computeProgram, this.vertices_buffer_id, "Vertices");
    this.bindBuffer(this.context, computeProgram, this.triangles_buffer_id, "Triangles");
    this.context.uniform1f(rngLoc, this.RENDER_SEED);
    this.context.uniform1i(sppLoc, this.SPP);
    this.context.uniformMatrix4fv(cameraInverseProjectionLoc, false, inverse_camera_perspective.elements);
    this.context.uniformMatrix4fv(cameraToWordLoc, false, camera_world_matrix.elements);
    this.context.dispatchCompute(this.frame_width / 16, this.frame_height / 16, 1);
    this.context.memoryBarrier(this.context.SHADER_IMAGE_ACCESS_BARRIER_BIT);

    // show computed texture to Canvas
    this.context.blitFramebuffer(
      0, 0, this.frame_width, this.frame_height,
      0, 0, this.frame_width, this.frame_height,
      this.context.COLOR_BUFFER_BIT, this.context.NEAREST);
  }
};

const script = async () => {
  let renderer = new Renderer();
  window.renderer = renderer;
  renderer.attach_mouse_events(window.document);
  renderer.init();
  renderer.render();
};

window.addEventListener('DOMContentLoaded', script);