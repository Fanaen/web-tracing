bool hit_world(Ray r, float t_max, inout float t, inout int mesh_indice, inout vec3 n)
{
    bool does_hit = false;
    float t_min = -1.0;
    t = 0.0;

    /*
    for (int i = 0, e = triangles.length(); i < e; i += 3)
    {
        vec3 v0 = vertices[triangles[i]];
        vec3 v1 = vertices[triangles[i + 1]];
        vec3 v2 = vertices[triangles[i + 2]];

        if (hit_triangle_mt(r, v0, v1, v2, t) && (t < t_min || t_min == -1.0))
        {
            t_min = t;
            n = normalize(cross(v1 - v0, v2 - v0));
            does_hit = true;

        }
    }

    t = t_min;
    return does_hit;
    */
    mesh_indice = -1;

    for (int i = 0; i < meshes.length(); ++i)
    {
        Mesh mesh = meshes[i];

        for (int j = 0; j < mesh.triangle_count * 3; j += 3)
        {
            vec3 v0 = vertices[triangles[mesh.offset + j]];
            vec3 v1 = vertices[triangles[mesh.offset + j + 1]];
            vec3 v2 = vertices[triangles[mesh.offset + j + 2]];

            if (hit_triangle_mt(r, v0, v1, v2, t) && (t < t_min || t_min == -1.0) && t < t_max)
            {
                t_min = t;
                does_hit = true;
                mesh_indice = i;
                n = normalize(cross(v1 - v0, v2 - v0));
            }

        }
    }

    t = t_min;

    return does_hit;
}

vec3 random_point_on_mesh(Mesh m, inout float seed, vec2 pixel)
{
    return vertices[triangles[m.offset]];
}

// Compute the color for a given ray.
vec3 color(Ray r, inout float seed, vec2 pixel)
{
    float t;
    vec3 n;
    int max_depth = 1;
    int depth = 0;
    int mesh_indice;

    float factor = 0.0;

    vec3 color = vec3(0.0);

    Mesh light_mesh = meshes[1];

    if (meshes.length() == 1)
    {
        //return vec3(0.0, 1.0, 0.0);
    }

    while (depth < max_depth && hit_world(r, MAX_FLOAT, t, mesh_indice, n) && t > 0.0)
    {
        Mesh mesh = meshes[mesh_indice];

        vec3 p = ray_at(r, t);
        r.origin = p;
        vec2 s = rand2(seed, pixel);
        vec3 target = r.origin + n + sample_sphere_uniform(s);
        r.direction = target - r.origin;
        //r.direction = reflect(p - r.origin, n);
        factor += mesh.emission;

        vec3 lp = random_point_on_mesh(light_mesh, seed, pixel);
        vec3 lpp = p - lp;
        float dist = dot(lpp, lpp);

        if (!hit_world(r, dist - EPSILON, t, mesh_indice, n))
        {
            factor += light_mesh.emission;
            color = vec3(mesh.diffuse[0], mesh.diffuse[1], mesh.diffuse[2]);
        }


        depth++;
    }

    return color * factor;

    return color;

    vec3 dir = normalize(r.direction);
    t = 0.5 * (dir.y + 1.0);
    return  factor * ((1.0 - t) * vec3(1.0, 1.0, 1.0) + t * vec3(0.5, 0.7, 1.0));
}