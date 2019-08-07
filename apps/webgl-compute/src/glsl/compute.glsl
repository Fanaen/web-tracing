#version 310 es
precision highp float;
precision highp int;
precision mediump image2DArray;

@import ./includes/sphere;

@import ./includes/layout;
@import ./includes/uniform;

@import ./includes/math;
@import ./includes/rng;
@import ./includes/ray;
@import ./includes/sphere_intersection;
@import ./includes/shading;
@import ./includes/camera;

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

    vec3 finalColor = vec3(0.0);

    // Anti-aliasing loop.
    for (int s = 0; s < uSamplesPerPixel; ++s)
    {
        vec2 sample_pos = (vec2(storePos) + rand2(seed, uv)) / vec2(imageSize);

        // Generate a camera ray.
        Ray r = create_camera_ray(sample_pos);

        // Shade the sample.
        finalColor += color(r);
    }

    // Shade the pixel.
    finalColor /= float(uSamplesPerPixel);

    // Write the pixel.
    imageStore(destTex, storePos, vec4(finalColor, 1.0));
}