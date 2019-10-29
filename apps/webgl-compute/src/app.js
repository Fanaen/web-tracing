
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
var debug_buffers = false;

import { floor_triangles, floor_vertices, top_light_triangles, top_light_vertices, small_box_triangles, small_box_vertices, ceilling_vertices, ceilling_triangles, background_vertices, background_triangles, left_wall_vertices, left_wall_triangles, right_wall_vertices, right_wall_triangles, tall_box_triangles, tall_box_vertices } from './cornel_box.js';
import { Mesh, create_meshes_buffer } from './mesh.js';

class Renderer {
  constructor() {
    console.log('loaded glm-js version: ', glm.version);

    this.RENDER_SEED = 1000;
    this.SPP = 0;
    this.camera_position = glm.vec3(-5.813, -0.187, 17.0);
    this.camera_rotation = glm.vec3(-0.208, -0.065, 0.0);
    this.camera_fov = 40.0;
    this.frame_width = 500;
    this.frame_height = 500;

    // => Create the scene.
    this.meshes = new Array();
    var floor = new Mesh("floor", floor_vertices, floor_triangles);
    var light = new Mesh("light", top_light_vertices, top_light_triangles);
    var small_box = new Mesh("small_box", small_box_vertices, small_box_triangles);
    var tall_box = new Mesh("tall_box", tall_box_vertices, tall_box_triangles);
    var ceilling = new Mesh("ceilling", ceilling_vertices, ceilling_triangles);
    var background = new Mesh("background", background_vertices, background_triangles);
    var left_wall = new Mesh("left_wall", left_wall_vertices, left_wall_triangles);
    var right_wall = new Mesh("right_wall", right_wall_vertices, right_wall_triangles);
    right_wall.diffuse_color = glm.vec3(0.5, 0.0, 0.0);
    left_wall.diffuse_color = glm.vec3(0.0, 0.5, 0.0);
    light.emission = glm.vec3(100.0);
    light.diffuse_color = glm.vec3(0.0);
    this.meshes.push(floor, light, small_box, tall_box, ceilling, background, left_wall, right_wall);
  }

  init() {
    this.rayMetricSpan = document.getElementById("rayMetric");

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

    this.create_scene_buffer(this.context);

    this.compile_shaders();
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
        this.SPP = 0;
      }
      else if (this.mouse_down && !this.mouse_right)
      {
        const new_mouse_pos = glm.vec2(e.clientX, e.clientY);
        this.camera_rotation.y += (new_mouse_pos.x - this.mouse_pos.x) * 0.005;
        this.camera_rotation.x -= (new_mouse_pos.y - this.mouse_pos.y) * 0.002;
        this.mouse_pos = new_mouse_pos;
        this.SPP = 0;
      }
    }

    document.addEventListener('wheel', (e) => {
      this.camera_position.z += e.deltaY * 0.005;
      this.SPP = 0;
    });
  }

  create_scene_buffer(context)
  {
    // Find the total number of vertices and triangles.
    let total_vertice_count = 0, total_triangle_count = 0;
    this.meshes.forEach(mesh => {
      total_vertice_count += mesh.vertices.length;
      total_triangle_count += mesh.indices.length;
    });

    if (debug_buffers) console.log("Total : ", total_vertice_count / 3, total_triangle_count / 3);

    // Create a buffer containing all vertices.
    // We must pad to fit in vec4 -> https://stackoverflow.com/questions/29531237/memory-allocation-with-std430-qualifier.
    const vertices_buffer = new Float32Array((total_vertice_count / 3) * 4);

    let gpu_i = 0; 
    let triangles_buffer = new Array();
    let indices_offset = 0;
    let accumulating_triangle_count = 0;

    this.meshes.forEach(mesh => {
      let vertices = mesh.vertices;

      if (debug_buffers) console.log("Mesh " + mesh.name + " " + mesh.vertice_count + " vertices : ", vertices);
      if (debug_buffers) console.log("Mesh " + mesh.name + " " + mesh.triangle_count + " triangles : ", mesh.indices);

      for (var i = 0; i < vertices.length; i += 3)
      {
        vertices_buffer[gpu_i++] = vertices[i];
        vertices_buffer[gpu_i++] = vertices[i + 1];
        vertices_buffer[gpu_i++] = vertices[i + 2];
        vertices_buffer[gpu_i++] = 0.0;
      }

      triangles_buffer = triangles_buffer.concat(mesh.indices.map(i => i + indices_offset));
      mesh.offset = accumulating_triangle_count;
      accumulating_triangle_count += mesh.triangle_count * 3;
      indices_offset += mesh.vertice_count;
    });

    console.assert(gpu_i == vertices_buffer.length, "GPU buffer does not match verticies count.", gpu_i, vertices_buffer.length);
    console.assert(gpu_i == ((total_vertice_count / 3) * 4));

    if (debug_buffers) console.log("Vertices : ", vertices_buffer);

    // Fill and send the vertices buffer to the gpu.
    this.vertices_buffer_id = context.createBuffer();
    context.bindBuffer(context.SHADER_STORAGE_BUFFER, this.vertices_buffer_id);
    context.bufferData(context.SHADER_STORAGE_BUFFER, vertices_buffer.length * 4, context.STATIC_DRAW);
    context.bufferSubData(context.SHADER_STORAGE_BUFFER, 0, vertices_buffer);

    // Create a buffer containing all triangles.

    triangles_buffer = new Int32Array(triangles_buffer);

    if (debug_buffers) console.log("Triangles : ", triangles_buffer);

    // Fill and send the triangles buffer to the gpu.
    this.triangles_buffer_id = context.createBuffer();
    context.bindBuffer(context.SHADER_STORAGE_BUFFER, this.triangles_buffer_id);
    context.bufferData(context.SHADER_STORAGE_BUFFER, triangles_buffer.length * 4, context.STATIC_DRAW);
    context.bufferSubData(context.SHADER_STORAGE_BUFFER, 0, triangles_buffer);

    // Create the texture into which the image will be rendered.
    this.texture = this.context.createTexture();
    this.context.bindTexture(this.context.TEXTURE_2D, this.texture);
    this.context.texStorage2D(this.context.TEXTURE_2D, 1, this.context.RGBA8, this.frame_width, this.frame_height);

    // Create a frameBuffer to be able to blit a texture into the canvas.
    this.frameBuffer = this.context.createFramebuffer();
    this.context.bindFramebuffer(this.context.READ_FRAMEBUFFER, this.frameBuffer);
    this.context.framebufferTexture2D(this.context.READ_FRAMEBUFFER, this.context.COLOR_ATTACHMENT0, this.context.TEXTURE_2D, this.texture, 0);

    // Create a buffer containing all meshes.
    const meshes_buffer = create_meshes_buffer(this.meshes);

    this.meshes_buffer_id = context.createBuffer();
    context.bindBuffer(context.SHADER_STORAGE_BUFFER, this.meshes_buffer_id);
    context.bufferData(context.SHADER_STORAGE_BUFFER, meshes_buffer, context.STATIC_DRAW);
    context.bindBufferBase(context.SHADER_STORAGE_BUFFER, 0, this.meshes_buffer_id);
  }

  bindBuffer(context, compute_program, buffer_id, layout_name)
  {
    let index = context.getProgramResourceIndex(compute_program, context.SHADER_STORAGE_BLOCK, layout_name);
    let bind = context.getProgramResource(compute_program, context.SHADER_STORAGE_BLOCK, index, [context.BUFFER_BINDING,])[0];
    context.bindBufferBase(context.SHADER_STORAGE_BUFFER, bind, buffer_id);
  }

  compile_shaders()
  {
    const computeShaderSource = require('./glsl/compute.glsl');

    //=> Compile the program.
    const computeShader = this.context.createShader(this.context.COMPUTE_SHADER);
    this.context.shaderSource(computeShader, computeShaderSource);
    this.context.compileShader(computeShader);

    if (!this.context.getShaderParameter(computeShader, this.context.COMPILE_STATUS)) {
      console.error(this.context.getShaderInfoLog(computeShader));
      this.context = null;
      return;
    }

    //=> Create the program.
    this.renderProgram = this.context.createProgram();
    this.context.attachShader(this.renderProgram, computeShader);
    this.context.linkProgram(this.renderProgram);

    if (!this.context.getProgramParameter(this.renderProgram, this.context.LINK_STATUS)) {
      console.error(this.context.getProgramInfoLog(this.renderProgram));
      this.context = null;
      return;
    }

    //=> Find uniform locations.
    this.uniform_locations = {
      rng :                         this.context.getUniformLocation(this.renderProgram, "uInitialSeed"),
      spp :                         this.context.getUniformLocation(this.renderProgram, "uSamples"),
      camera_to_world :             this.context.getUniformLocation(this.renderProgram, "uCameraToWorld"),
      camera_inverse_projection :   this.context.getUniformLocation(this.renderProgram, "uCameraInverseProjection")
    };
  }

  render() {
    if (!this.context) {
      return;
    }

    if (!document.querySelector('.progressiveRendering').checked && this.SPP != 0)
    {
      return;
    }
    
    //=> Bind the texture.
    this.context.bindImageTexture(0, this.texture, 0, false, 0, this.context.WRITE_ONLY, this.context.RGBA8);
    
    //=> Configure the camera.
    const camera_perspective = glm.perspective(glm.radians(this.camera_fov), this.frame_width / this.frame_height, 0.1, 100.0);
    const inverse_camera_perspective = glm.inverse(camera_perspective);
    let camera_world_matrix = glm.mat4();
    camera_world_matrix = glm.rotate(camera_world_matrix, this.camera_rotation.y, glm.vec3(0.0, -1.0, 0.0));
    camera_world_matrix = glm.rotate(camera_world_matrix, this.camera_rotation.x, glm.vec3(1.0, 0.0, 0.0));
    camera_world_matrix = glm.translate(camera_world_matrix, this.camera_position);

    const t0 = performance.now();
    
    this.context.useProgram(this.renderProgram);

    //=> Bind the buffers to the rendering shader.
    this.bindBuffer(this.context, this.renderProgram, this.vertices_buffer_id, "Vertices");
    this.bindBuffer(this.context, this.renderProgram, this.triangles_buffer_id, "Triangles");
    this.bindBuffer(this.context, this.renderProgram, this.meshes_buffer_id, "Meshes");

    //=> Fill the rendering shader uniforms.
    this.context.uniform1f(this.uniform_locations.rng, this.RENDER_SEED);
    this.context.uniform1i(this.uniform_locations.spp, this.SPP);
    this.context.uniformMatrix4fv(this.uniform_locations.camera_inverse_projection, false, inverse_camera_perspective.elements);
    this.context.uniformMatrix4fv(this.uniform_locations.camera_to_world, false, camera_world_matrix.elements);

    //=> Render the frame.
    this.context.dispatchCompute(this.frame_width / 16, this.frame_height / 16, 1);

    // Wait for the compute shader to finish (not necessary, i keep it only for debug).
    this.context.memoryBarrier(this.context.SHADER_STORAGE_BARRIER_BIT);

    //=> Show the frame.
    this.context.blitFramebuffer(
      0, 0, this.frame_width, this.frame_height,
      0, 0, this.frame_width, this.frame_height,
      this.context.COLOR_BUFFER_BIT, this.context.NEAREST);
      
    //=> Compute metrics.
    const t1 = performance.now();
    const timeSpentInSecondes = (t1 - t0) / 1000.0;

    const primary_ray_count = this.frame_height * this.frame_width / 1000000.0;
    const ray_metric = Math.round(primary_ray_count / timeSpentInSecondes);

    this.rayMetricSpan.innerText = ray_metric.toString();

    this.SPP += 1;
  }
}

const script = async () => {
  let renderer = new Renderer();
  window.renderer = renderer;
  renderer.attach_mouse_events(window.document);
  renderer.init();

  let animationFrame = function(timestamp) {
    if (renderer.SPP < 32)
    {
      renderer.render();
      renderer.RENDER_SEED += 1;
    }

    window.requestAnimationFrame(animationFrame);
  }

  window.requestAnimationFrame(animationFrame);
};

window.addEventListener('DOMContentLoaded', script);