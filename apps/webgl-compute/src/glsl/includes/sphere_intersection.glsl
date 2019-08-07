
// Test intersection between a ray and a sphere.
bool hit_sphere(vec3 center, float radius, Ray r, out float t)
{
    vec3 oc = r.origin - center;
    float a = dot(r.direction, r.direction);
    float b = 2.0 * dot(oc, r.direction);
    float c = dot(oc, oc) - radius * radius;
    float discriminent = b * b - 4.0 * a * c;
    if (discriminent >= 0.0)
    {
        t = (-b - sqrt(discriminent)) / (2.0 * a);
        return true;
    }

    return false;
}