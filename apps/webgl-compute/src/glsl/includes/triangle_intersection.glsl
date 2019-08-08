
// Test intersection between a ray and a triangle using Möller–Trumbore algorithm.
bool hit_triangle_mt(Ray r, out float t)
{
    vec3 v0 = vec3(0.0, 0.0, -5.0);
    vec3 v1 = vec3(0.0, 1.0, -5.0);
    vec3 v2 = vec3(2.0, 1.0, -5.0);
    vec3 e1 = v1 - v0;
    vec3 e2 = v2 - v0;
    vec3 h = cross(r.direction, e2);
    float a = dot(e1, h);

    if (a > -EPSILON && a < EPSILON)
        return false;

    float f = 1.0 / a;
    vec3 s = r.origin - v0;
    float u = f * dot(s, h);

    if (u < 0.0 || u > 1.0)
        return false;

    vec3 q = cross(s, e1);
    float v = f * dot(r.direction, q);
    if (v < 0.0 || u + v > 1.0)
        return false;
    
    t = f * dot(e2, q);
    if (t > EPSILON)
    {
        return true;
    }

    return false;
}