bool hit_world(Ray r, inout float t, inout vec3 n)
{
    bool does_hit = false;
    float t_min = -1.0;
    t = 0.0;

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
}

// Compute the color for a given ray.
vec3 color(Ray r, inout float seed, vec2 pixel)
{
    float t;
    vec3 n;
    int max_depth = 3;
    int depth = 0;

    float factor = 1.0;

    vec3 color;

    while (depth < max_depth && hit_world(r, t, n) && t > 0.0)
    {
        vec3 p = ray_at(r, t);
        r.origin = p;
        vec2 s = rand2(seed, pixel);
        vec3 target = r.origin + n + sample_sphere_uniform(s);
        r.direction = target - r.origin;
        //r.direction = reflect(p - r.origin, n);
        factor *= 0.5;

        if (depth == 0)
        {
            color = n * 0.5 + 0.5;
        }

        depth++;
    }

    vec3 dir = normalize(r.direction);
    t = 0.5 * (dir.y + 1.0);
    return  factor * ((1.0 - t) * vec3(1.0, 1.0, 1.0) + t * vec3(0.5, 0.7, 1.0));
}