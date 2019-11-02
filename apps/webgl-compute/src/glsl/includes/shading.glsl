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

    t = best_min_t;

    return does_hit;
}

vec3 random_point_on_mesh(Mesh m, inout float seed, vec2 pixel)
{
    return vertices[triangles[m.offset]];
}

//
// Availables algorithms.
//

// Show the surface color of the point hitten by the camera ray.
// #define CAMERA_RAY_COLOR

// Show the surface emission of the point hitten by the camera ray.
// #define CAMERA_RAY_EMISSION

// Don't compute DL and use lambertian BSDF to bounce.
#define NAIVE_LAMBERTIAN_PATH_TRACING

// Compute the color for a given ray.
vec3 color(Ray r, inout float seed, vec2 pixel)
{
    float t;
    vec3 n;
    int max_depth = 10;
    int depth = 0;
    int mesh_indice;


#if defined(CAMERA_RAY_COLOR)

    if (hit_world(r, EPSILON, MAX_FLOAT, t, mesh_indice, n) )
    {
        Mesh mesh = meshes[mesh_indice];
        return mesh.diffuse;
    }

    return vec3(0.0);

#elif defined(CAMERA_RAY_EMISSION)

    if (hit_world(r, EPSILON, MAX_FLOAT, t, mesh_indice, n) )
    {
        Mesh mesh = meshes[mesh_indice];
        return mesh.emission;
    }

    return vec3(0.0);

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

#else
    // Default fallback.

    return vec3(0.0, 1.0, 0.0);

#endif
}