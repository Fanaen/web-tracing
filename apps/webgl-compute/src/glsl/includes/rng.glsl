
//
// Pseudo random numbers generator.
//
// References:
// - http://blog.three-eyed-games.com/2018/05/12/gpu-path-tracing-in-unity-part-2/
//

float rand(inout float seed, vec2 pixel)
{
    float result = fract(sin(seed / 100.0f * dot(pixel, vec2(12.9898f, 78.233f))) * 43758.5453f);
    seed += 1.0f;
    return result;
}
