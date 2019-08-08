
// Compute the color for a given ray.
vec3 color(Ray r)
{
    Sphere sphere_min;
    float t_min = -1.0;
    float t = 0.0;
    for (int i = 0, e = spheres.length(); i < e; ++i)
    {
        if (hit_sphere(spheres[i].center, spheres[i].radius, r, t) && (t < t_min || t_min == -1.0))
        {
            t_min = t;
            sphere_min = spheres[i];
        }
    }
    t = t_min;

    //if (t > 0.0)
    if (hit_triangle_mt(r, t))
    {
        return vec3(1.0, 0.0, 0.0);
        //vec3 n = normalize(ray_at(r, t) - sphere_min.center);
        //return n * 0.5 + 0.5;
    }

    vec3 dir = normalize(r.direction);
    t = 0.5 * (dir.y + 1.0);
    return (1.0 - t) * vec3(1.0, 1.0, 1.0) + t * vec3(0.5, 0.7, 1.0);
}