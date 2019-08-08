
// Compute the color for a given ray.
vec3 color(Ray r)
{
    float t_min = -1.0;
    float t = 0.0;
    vec3 n;
    for (int i = 0, e = spheres.length(); i < e; ++i)
    {
        if (hit_sphere(spheres[i].center, spheres[i].radius, r, t) && (t < t_min || t_min == -1.0))
        {
            t_min = t;
            n = normalize(ray_at(r, t) - spheres[i].center);
        }
    }

    for (int i = 0, e = triangles.length(); i < e; i += 3)
    {
        vec3 v0 = vertices[triangles[i]];
        vec3 v1 = vertices[triangles[i + 1]];
        vec3 v2 = vertices[triangles[i + 2]];

        if (hit_triangle_mt(r, v0, v1, v2, t) && (t < t_min || t_min == -1.0))
        {
            t_min = t;
            n = normalize(cross(v1 - v0, v2 - v0));
        }
    }


    t = t_min;
    if (t > 0.0)
    {
        return n * 0.5 + 0.5;
    }

    vec3 dir = normalize(r.direction);
    t = 0.5 * (dir.y + 1.0);
    return (1.0 - t) * vec3(1.0, 1.0, 1.0) + t * vec3(0.5, 0.7, 1.0);
}