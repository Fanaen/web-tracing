use nalgebra_glm::clamp_vec;
use nalgebra_glm::Vec3;

pub fn clamp(value: f32, min: f32, max: f32) -> f32 {
    if value > max {
        max
    } else if value < min {
        min
    } else {
        value
    }
}

pub fn saturate(value: Vec3) -> Vec3 {
    let min_bounds = Vec3::new(0.0, 0.0, 0.0);
    let max_bounds = Vec3::new(1.0, 1.0, 1.0);
    clamp_vec(&value, &min_bounds, &max_bounds)
}