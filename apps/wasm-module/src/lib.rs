pub mod intersections;
mod utils;
mod sphere;

use crate::intersections::{ConvertibleVec3, Vector3, Ray, HitableList, Hitable};
use nalgebra_glm::{
    cross, dot, inverse, look_at, normalize, pi, radians, rotate_vec3, vec4_to_vec3, Mat4, Quat,
    Vec3, Vec4,
};
use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;
use web_sys::{CanvasRenderingContext2d, ImageData};
use crate::sphere::Sphere;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, web-tracing!");
}

#[wasm_bindgen]
pub fn draw(
    ctx: &CanvasRenderingContext2d,
    width: u32,
    height: u32,
    camera_pos: Vector3,
    camera_rotation: Vector3,
    camera_fov: f32,
) -> Result<(), JsValue> {
    let camera_pos = camera_pos.to_vec3();
    let camera_rotation = camera_rotation.to_vec3();
    let camera_up = Vec3::new(0.0, 1.0, 0.0);
    let mut camera_front = Vec3::new(0.0, 0.0, -1.0);

    let axis_x = Vec3::new(1.0, 0.0, 0.0);
    let axis_y = Vec3::new(0.0, 1.0, 0.0);
    let axis_z = Vec3::new(0.0, 0.0, 1.0);

    let degToRadians = pi::<f32>() / 180.0;
    camera_front = rotate_vec3(&camera_front, degToRadians * camera_rotation.x, &axis_x);
    camera_front = rotate_vec3(&camera_front, degToRadians * camera_rotation.y, &axis_y);
    camera_front = rotate_vec3(&camera_front, degToRadians * camera_rotation.z, &axis_z);
    camera_front = camera_front.normalize();

    let camera_center = camera_pos + camera_front;
    let camera_right = camera_front.cross(&camera_up).normalize();
    let camera_up = camera_right.cross(&camera_front).normalize();

    let aspect = (width as f32) / (height as f32);
    //console::log(&camera_fov.into());
    let camera_fov = camera_fov * degToRadians;
    let projection_matrix = Mat4::new_perspective(aspect, camera_fov, 0.1, 10000.0);
    let view_matrix = look_at(&camera_pos, &camera_center, &camera_up);

    let mat = projection_matrix * view_matrix;
    let inverse_view_proj = inverse(&mat);

    // Compute image corners.
    let plane_lower_left = inverse_view_proj * Vec4::new(-1.0, -1.0, 0.0, 1.0);
    let plane_lower_right = inverse_view_proj * Vec4::new(1.0, -1.0, 0.0, 1.0);
    let plane_upper_left = inverse_view_proj * Vec4::new(-1.0, 1.0, 0.0, 1.0);

    // Get the framer corner in world space.
    let lower_left = vec4_to_vec3(&(plane_lower_left / plane_lower_left.w));

    // Get the horizontal and vertical vectors of the frame.
    let horizontal = vec4_to_vec3(&(plane_lower_right / plane_lower_right.w)) - lower_left;
    let vertical = vec4_to_vec3(&(plane_upper_left / plane_upper_left.w)) - lower_left;

    let dataSize = (width * height) as usize;
    let mut data = Vec::with_capacity(dataSize);
    let origin = camera_pos;

    let mut world = HitableList::new();
    world.add(Box::from(Sphere::new(Vec3::new(0., 0., -1.), 0.5)));
    world.add(Box::from(Sphere::new(Vec3::new(0., -100.5, -1.), 100.)));

    for y in (0..height).rev() {
        for x in 0..width {
            let u = x as f32 / width as f32;
            let v = y as f32 / height as f32;
            let direction = (lower_left + (u * horizontal) + (v * vertical) - origin).normalize();
            let ray = Ray { origin, direction };

            let col = color(ray, &world);

            data.push((255.99 * col.x) as u8);
            data.push((255.99 * col.y) as u8);
            data.push((255.99 * col.z) as u8);
            data.push(255);
        }
    }

    //assert_eq!(data.len(), dataSize);

    let data = ImageData::new_with_u8_clamped_array_and_sh(Clamped(&mut data), width, height)?;
    ctx.put_image_data(&data, 0.0, 0.0)
}

pub fn color(ray: Ray, world: &HitableList) -> Vec3 {
    match world.hit(&ray, 0., std::f32::MAX) {
        Option::Some(hit) => {
            // Quand on a un hit, on affiche la couleur en fonction de la normale
            let N = hit.normal;
            0.5 * Vec3::new(N.x + 1., N.y + 1., N.z + 1.)
        },
        Option::None => {
            // On affiche le fond sinon
            let unit_direction = ray.direction.normalize();
            let t = 0.5 * (unit_direction.y + 1.);
            (1. - t) * Vec3::new(1., 1., 1.) + (t * Vec3::new(0.5, 0.7, 1.))
        }
    }
//    let center = Vec3::new(0., 0., -1.);
//    let t = hit_sphere(&center, 0.5, &ray);
//    if t > 0. {
//        let N: Vec3 = (ray.point_at_parameter(t) - Vec3::new(0., 0., -1.)).normalize();
//        return 0.5 * Vec3::new(N.x + 1., N.y + 1., N.z + 1.);
//    }
//
//    let unit_direction = ray.direction.normalize();
//    let t = 0.5 * (unit_direction.y + 1.);
//    (1. - t) * Vec3::new(1., 1., 1.) + (t * Vec3::new(0.5, 0.7, 1.))
}

pub fn clamp(value: f32, min: f32, max: f32) -> f32 {
    if value > max {
        max
    } else if value < min {
        min
    } else {
        value
    }
}
