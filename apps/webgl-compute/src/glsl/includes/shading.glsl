bool hit_world(Ray r, float t_min, float t_max, inout float t, inout int mesh_indice, inout vec3 n)
{
    bool does_hit = false;
    t = 0.0;
    float best_min_t = t_max;

    mesh_indice = -1;

    for (int i = 0; i < meshes.length(); ++i)
    {
        Mesh mesh = meshes[i];

        for (int j = 0; j < mesh.triangle_count * 3; j += 3)
        {
            vec3 v0 = vertices[triangles[mesh.offset + j]];
            vec3 v1 = vertices[triangles[mesh.offset + j + 1]];
            vec3 v2 = vertices[triangles[mesh.offset + j + 2]];

            if (hit_triangle_mt(r, v0, v1, v2, t) && t >= t_min && t < t_max && t < best_min_t)
            {
                best_min_t = t;
                does_hit = true;
                mesh_indice = i;
                n = normalize(cross(v1 - v0, v2 - v0));
            }

        }
    }

    if (does_hit)
    {
        t = best_min_t;
    }

    return does_hit;
}

vec3 random_point_on_mesh(Mesh m, inout float seed, vec2 pixel, out float p)
{
    // Pick a random triangle.
    int triangle = int(floor(rand(seed, pixel) * float(m.triangle_count)));

    // Pick vertices.
    vec3 v0 = vertices[triangles[m.offset + triangle]];
    vec3 v1 = vertices[triangles[m.offset + triangle + 1]];
    vec3 v2 = vertices[triangles[m.offset + triangle + 2]];

    float r = rand(seed, pixel);
    float s = rand(seed, pixel);

    if (r + s > 1.0)
    {
        r = 1.0 - r;
        s = 1.0 - s;
    }

    float t = 1.0 - r - s;
    
    float triangle_area = length(cross(v1 - v0, v2 - v0)) * 0.5;

    p = (1.0 / float(m.triangle_count)) / triangle_area;

    return v0 * r + v1 * s + v2 * t;
}

//
// Availables algorithms.
//

// Show the surface color of the point hitten by the camera ray.
// #define CAMERA_RAY_COLOR

// Show the surface emission of the point hitten by the camera ray.
// #define CAMERA_RAY_EMISSION

// Show the surface normal of the point hitten by the camera ray.
// #define CAMERA_RAY_NORMAL

// Don't compute DL and use lambertian BSDF to bounce.
// #define NAIVE_LAMBERTIAN_PATH_TRACING

// Show the light influence on the surface point hitten by the camera ray.
// #define LIGHT_ATTENUATION

// Compute direct lighting for the surface point hitten by the camera ray and don't bounce.
#define NO_BOUNCE_DIRECT_LIGHTING

// Compute the color for a given ray.
vec3 color(Ray r, inout float seed, vec2 pixel)
{
    float t;
    vec3 n;
    int max_depth = 10;
    int depth = 0;
    int mesh_indice;


// Show the surface color of the point hitten by the camera ray.
#if defined(CAMERA_RAY_COLOR)

    if (hit_world(r, EPSILON, MAX_FLOAT, t, mesh_indice, n) && t > 0.0)
    {
        Mesh mesh = meshes[mesh_indice];
        return mesh.diffuse;
    }

    return vec3(0.0);

// Show the surface emission of the point hitten by the camera ray.
#elif defined(CAMERA_RAY_EMISSION)

    if (hit_world(r, EPSILON, MAX_FLOAT, t, mesh_indice, n) && t > 0.0)
    {
        Mesh mesh = meshes[mesh_indice];
        return mesh.emission;
    }

    return vec3(0.0);

// Show the surface normal of the point hitten by the camera ray.
#elif defined(CAMERA_RAY_NORMAL)

    if (hit_world(r, EPSILON, MAX_FLOAT, t, mesh_indice, n) && t > 0.0)
    {
        return n * 0.5 + vec3(0.5);
    }

    return vec3(0.0);

// Don't compute DL and use lambertian BSDF to bounce.
#elif defined(NAIVE_LAMBERTIAN_PATH_TRACING)

    vec3 color = vec3(0.0);

    while (depth < max_depth 
        && hit_world(r, EPSILON, MAX_FLOAT, t, mesh_indice, n) 
        && t > 0.0)
    {
        Mesh mesh = meshes[mesh_indice];

        // Stop this path if we hit a light.
        if (mesh.emission != vec3(0.0))
        {
            // Is it the first ray ?
            if (depth == 0)
            {
                return mesh.emission;
            }

            return mesh.emission * color;
        }

        // Is it the first hit ?
        if (depth == 0)
        {
            color = mesh.diffuse;
        }
        else
        {
            color *= mesh.diffuse;
        }

        vec3 p = ray_at(r, t);
        vec2 s = rand2(seed, pixel);
        vec3 target = p + n + sample_sphere_uniform(s);
        r.origin = p;
        r.direction = normalize(target - r.origin);

        depth++;
    }

    return vec3(0.0);

// Show the light influence on the surface point hitten by the camera ray.
#elif defined(LIGHT_ATTENUATION)

    if (hit_world(r, EPSILON, MAX_FLOAT, t, mesh_indice, n) && t > 0.0)
    {
        Mesh mesh = meshes[mesh_indice];

        if (mesh.emission != vec3(0.0))
        {
            return mesh.emission;
        }

        vec3 hit_point = ray_at(r, t);

        // todo: Pick a random light.
        Mesh light = meshes[0];

        // Generate a point on the light.
        vec3 light_point = random_point_on_mesh(light, seed, pixel);

        float falloff = 1.0 / length(hit_point - light_point);

        return vec3(falloff);
    }

    return vec3(0.0);

// Compute direct lighting for the surface point hitten by the camera ray and don't bounce.
#elif defined(NO_BOUNCE_DIRECT_LIGHTING)

    if (hit_world(r, EPSILON, MAX_FLOAT, t, mesh_indice, n))
    {
        Mesh mesh = meshes[mesh_indice];
        vec3 surface_normal = n;

        if (mesh.emission != vec3(0.0))
        {
            return mesh.emission;
        }

        vec3 hit_point = ray_at(r, t);

        // todo: Pick a random light.
        int light_indice = 0;
        Mesh light = meshes[light_indice];

        float p = 0.0;

        // Generate a point on the light.
        // todo: pick a random triangle.
        vec3 light_point = random_point_on_mesh(light, seed, pixel, p);

        vec3 lh = light_point - hit_point;
        float dist = length(lh);

        // Trace a shadow ray.
        Ray shadow_ray;
        shadow_ray.origin = hit_point;
        shadow_ray.direction = normalize(lh);

        if (hit_world(shadow_ray, EPSILON, dist, t, mesh_indice, n) 
            && mesh_indice != light_indice)
        {
            return vec3(0.0, 0.0, 0.0);
        }

        // Compute direct lighting.
        return p * mesh.diffuse * light.emission * abs(dot(surface_normal, shadow_ray.direction));
    }

    return vec3(0.0);

// Default fallback.
#else

    return vec3(0.0, 1.0, 0.0);

#endif
}