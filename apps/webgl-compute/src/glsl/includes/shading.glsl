
// Compute the color for a given ray.
vec3 color(Ray r)
{
    vec3 sphere_center = vec3(0.0, 0.0, -1.0);
    float sphere_radius = 0.5;

    float t = hit_sphere(sphere_center, sphere_radius, r);
    if (t > 0.0)
    {
        vec3 n = normalize(ray_at(r, t) - vec3(0.0, 0.0, -1.0));
        return n * 0.5 + 0.5;
    }

    vec3 dir = normalize(r.direction);
    t = 0.5 * (dir.y + 1.0);
    return (1.0 - t) * vec3(1.0, 1.0, 1.0) + t * vec3(0.5, 0.7, 1.0);
}