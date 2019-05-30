mod camera;
pub mod intersections;
mod sphere;
mod utils;

use crate::camera::Camera;
use crate::intersections::{ConvertibleVec3, Hitable, HitableList, Ray, Vector3};
use crate::sphere::Sphere;
use nalgebra_glm::Vec3;
use rand::Rng;
use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;
use web_sys::{CanvasRenderingContext2d, ImageData};
use rand::prelude::ThreadRng;

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
    let camera = Camera::new(
        camera_pos.to_vec3(),
        camera_rotation.to_vec3(),
        camera_fov,
        width,
        height,
    );

    let dataSize = (width * height) as usize;
    let mut data = Vec::with_capacity(dataSize);

    let mut world = HitableList::new();
    world.add(Box::from(Sphere::new(Vec3::new(0., 0., -1.), 0.5)));
    world.add(Box::from(Sphere::new(Vec3::new(0., -100.5, -1.), 100.)));

    let mut rng = rand::thread_rng();

    let samples = 100;
    for y in (0..height).rev() {
        for x in 0..width {
            let mut col = Vec3::new(0., 0., 0.);
            for _ in 0..samples {
                let u = (x as f32 + rng.gen_range(0., 1.)) / width as f32;
                let v = (y as f32 + rng.gen_range(0., 1.)) / height as f32;
                let ray = camera.get_ray(u, v);
                col = col + color(ray, &world, &mut rng);
            }

            col = col / samples as f32;
            data.push((255.99 * col.x) as u8);
            data.push((255.99 * col.y) as u8);
            data.push((255.99 * col.z) as u8);
            data.push(255);
        }
    }

    let data = ImageData::new_with_u8_clamped_array_and_sh(Clamped(&mut data), width, height)?;
    ctx.put_image_data(&data, 0.0, 0.0)
}

pub fn random_in_unit_sphere(rng: &mut ThreadRng) -> Vec3 {
    let mut p: Vec3 =
        2. * Vec3::new(
            rng.gen_range(0., 1.),
            rng.gen_range(0., 1.),
            rng.gen_range(0., 1.),
        ) - Vec3::new(1., 1., 1.);

    while p.magnitude_squared() > 1. {
        p =
            2. * Vec3::new(
                rng.gen_range(0., 1.),
                rng.gen_range(0., 1.),
                rng.gen_range(0., 1.),
            ) - Vec3::new(1., 1., 1.);
    }

    p
}

pub fn color(ray: Ray, world: &HitableList, rng: &mut ThreadRng) -> Vec3 {
    match world.hit(&ray, 0., std::f32::MAX) {
        Option::Some(hit) => {
            let target = hit.point.clone() + hit.normal + random_in_unit_sphere(rng);
            let diffuseRay = Ray {
                origin: hit.point,
                direction: target - hit.point,
            };

            0.5 * color(diffuseRay, world, rng)
        }
        Option::None => {
            // On affiche le fond sinon
            let unit_direction = ray.direction.normalize();
            let t = 0.5 * (unit_direction.y + 1.);
            (1. - t) * Vec3::new(1., 1., 1.) + (t * Vec3::new(0.5, 0.7, 1.))
        }
    }
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
