#version 310 es

layout (local_size_x = 16, local_size_y = 16, local_size_z = 1) in;
layout (rgba8, binding = 0) writeonly uniform highp image2D destTex;

@import ./includes/math;
@import ./includes/rng;
@import ./includes/ray;
@import ./includes/sphere;
@import ./includes/shading;

uniform float uInitialSeed;
uniform int uSamplesPerPixel;

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
    float seed = uInitialSeed;

    // Configure a camera.
    vec3 lower_left_corner = vec3(-2.0, -1.0, -1.0);
    vec3 horizontal = vec3(4.0, 0.0, 0.0);
    vec3 vertical = vec3(0.0, 2.0, 0.0);
    vec3 origin = vec3(0.0, 0.0, 0.0);

    vec3 finalColor = vec3(0.0);

    // Anti-aliasing loop.
    for (int s = 0; s < uSamplesPerPixel; ++s)
    {
        vec2 sample_pos = (vec2(storePos) + rand2(seed, uv)) / vec2(imageSize);
        //finalColor = vec3(sample_pos, 0.0);

        // Generate a camera ray.
        Ray r;
        r.origin = origin;
        r.direction = lower_left_corner + sample_pos.x * horizontal + sample_pos.y * vertical;

        // Shade the sample.
        finalColor += color(r);
    }

    // Shade the pixel.
    finalColor /= float(uSamplesPerPixel);

    // Write the pixel.
    imageStore(destTex, storePos, vec4(finalColor, 1.0));
}