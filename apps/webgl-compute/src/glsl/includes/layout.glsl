
// 
// Useful links to understand memory layout:
// - https://www.khronos.org/opengl/wiki/Shader_Storage_Buffer_Object
// - https://www.khronos.org/opengl/wiki/Layout_Qualifier_(GLSL)#Binding_points
// - https://groups.google.com/forum/#!msg/webgl-dev-list/rccKP94Taa4/yFayqtLDHgAJ
// - https://groups.google.com/forum/#!msg/webgl-dev-list/rccKP94Taa4/dJXZAUbXAQAJ
// - https://community.khronos.org/t/size-of-elements-of-arrays-in-shader-storage-buffer-objects/69803#post366983
// 
layout (local_size_x = 16, local_size_y = 16, local_size_z = 1) in;

layout (rgba8, binding = 0) writeonly uniform highp image2D frameTex;
layout (rgba8, binding = 1) readonly uniform highp image2D accumulatedTex;

layout (std430, binding = 1) readonly buffer Vertices {
    vec3 vertices[];
};

layout (std430, binding = 2) readonly buffer Triangles {
    int triangles[];
};

layout (std430, binding = 3) readonly buffer Meshes {
    Mesh meshes[];
};