pub mod intersections;
mod utils;

use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;
use web_sys::{CanvasRenderingContext2d, ImageData};
use nalgebra_glm::{dot, Vec3};
use crate::intersections::{Vector3, ConvertibleVec3};

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
    camera_pos: Vector3
) -> Result<(), JsValue> {
    let camera_pos = camera_pos.to_vec3();

    let lower_left_corner = Vec3::new(-2., -1., -1.);
    let horizontal = Vec3::new(4., 0., 0.);
    let vertical = Vec3::new(0., 2., 0.);
    let origin = Vec3::new(0., 0., 0.);

    let dataSize = (width * height) as usize;
    let mut data = Vec::with_capacity(dataSize);

    for y in (0..height).rev() {
        for x in 0..width {
            let u = x as f32 / width as f32;
            let v = y as f32 / height as f32;
            let ray = Ray {
                origin,
                direction: lower_left_corner + (u * horizontal) + (v * vertical)
            };

            let col = color(ray);

            data.push((255.99 * col.x) as u8);
            data.push((255.99 * col.y) as u8);
            data.push((255.99 * col.z) as u8);
            data.push(255);
        }
    }

    //assert_eq!(data.len(), dataSize);

    let data = ImageData::new_with_u8_clamped_array_and_sh(Clamped(&mut data), width, height)?;
    ctx.put_image_data(&data, 0.0, 0.0,)
}

pub struct Ray {
    pub origin: Vec3,
    pub direction: Vec3
}

fn hit_sphere(center: &Vec3, radius: f32, ray: &Ray) -> bool {
    let oc: Vec3 = ray.origin - center;
    let a: f32 = dot(&ray.direction, &ray.direction);
    let b: f32 = 2. * dot(&oc, &ray.direction);
    let c: f32 = dot(&oc, &oc) - radius * radius;
    let discriminant: f32 = b * b - 4. * a * c;
    discriminant > 0.
}

pub fn color(ray: Ray) -> Vec3 {
    let center = Vec3::new(0., 0., -1.);
    if hit_sphere(&center, 0.5, &ray) {
        return Vec3::new(1., 0., 0.);
    }

    let unit_direction = ray.direction.normalize();
    let t = 0.5 * (unit_direction.y + 1.);
    (1. - t) * Vec3::new(1.,1.,1.) + (t * Vec3::new(0.5, 0.7, 1.))
}

pub fn clamp(value: f32, min: f32, max: f32) -> f32 {
    if value > max { max } else if value < min { min } else { value }
}