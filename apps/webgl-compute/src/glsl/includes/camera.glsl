
Ray create_camera_ray(vec2 uv)
{
    vec3 origin = (uCameraToWorld * vec4(0.0, 0.0, 0.0, 1.0)).xyz;

    vec3 direction = (uCameraInverseProjection * vec4(uv, 0.0, 1.0)).xyz;
    direction = (uCameraToWorld * vec4(direction, 0.0)).xyz;
    direction = normalize(direction);

    Ray res;
    res.origin = origin;
    res.direction = direction;
    return res;
}