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
uniform mat4 uCameraToWorld;
uniform mat4 uCameraInverseProjection;

Ray create_camera_ray(vec2 uv)
{
    vec3 origin = (uCameraToWorld * vec4(0.0, 0.0, 0.0, 1.0)).xyz;

    vec3 direction = (uCameraInverseProjection * vec4(uv, 0.0, 1.0)).xyz;
    direction = (uCameraToWorld * vec4(direction, 0.0)).xyz;
    direction = normalize(direction);

    Ray res;
    res.origin = origin;
    res.direction = direction;
    return res;
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