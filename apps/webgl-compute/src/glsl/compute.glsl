#version 310 es

layout (local_size_x = 16, local_size_y = 16, local_size_z = 1) in;
layout (rgba8, binding = 0) writeonly uniform highp image2D destTex;

//
// A ray.
//

struct Ray {
    vec3 origin;
    vec3 direction;
};


//
// Rendering procedures declarations.
//

vec3 color(Ray r);
float hit_sphere(vec3 center, float radius, Ray r);


//
// Rendering procedures definitions.
//

// Compute the color for a given ray.
vec3 color(Ray r)
{
    vec3 sphere_center = vec3(0.0, 0.0, -1.0);
    float sphere_radius = 0.5;

    float t = hit_sphere(sphere_center, sphere_radius, r);
    if (t > 0.0)
    {
        vec3 n = normalize(r.origin + r.direction * t - vec3(0.0, 0.0, -1.0));
        return n * 0.5 + 0.5;
    }

    vec3 dir = normalize(r.direction);
    t = 0.5 * (dir.y + 1.0);
    return (1.0 - t) * vec3(1.0, 1.0, 1.0) + t * vec3(0.5, 0.7, 1.0);
}

// Test intersection between a ray and a sphere.
float hit_sphere(vec3 center, float radius, Ray r)
{
    vec3 oc = r.origin - center;
    float a = dot(r.direction, r.direction);
    float b = 2.0 * dot(oc, r.direction);
    float c = dot(oc, oc) - radius * radius;
    float discriminent = b * b - 4.0 * a * c;
    if (discriminent < 0.0)
        return -1.0;
    else
        return (-b - sqrt(discriminent)) / (2.0 * a);
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