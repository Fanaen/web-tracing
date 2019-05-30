use crate::pathtracer::camera::Camera;
use crate::pathtracer::PathTracer;
use crate::utils::set_panic_hook;
use nalgebra_glm::Vec3;
use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;
use web_sys::{CanvasRenderingContext2d, ImageData};

#[wasm_bindgen]
pub fn draw(
    ctx: &CanvasRenderingContext2d,
    width: u32,
    height: u32,
    camera_pos: Vector3,
    camera_rotation: Vector3,
    camera_fov: f32,
) -> Result<(), JsValue> {
    set_panic_hook();

    let camera = Camera::new(
        camera_pos.to_vec3(),
        camera_rotation.to_vec3(),
        camera_fov,
        width,
        height,
    );

    let mut pathtracer = PathTracer::new(camera);

    pathtracer.random_spheres();

    // Call the pathtracer once per pixel and build the image
    let data_size = (width * height) as usize;
    let mut data = Vec::with_capacity(data_size);

    for y in (0..height).rev() {
        for x in 0..width {
            let col = pathtracer.compute_pixel(x, y);
            data.push((255.99 * col.x.sqrt()) as u8);
            data.push((255.99 * col.y.sqrt()) as u8);
            data.push((255.99 * col.z.sqrt()) as u8);
            data.push(255);
        }
    }

    let data = ImageData::new_with_u8_clamped_array_and_sh(Clamped(&mut data), width, height)?;
    ctx.put_image_data(&data, 0.0, 0.0)
}

/// Wraps around the Vec3 struct from nalgebra for wasm-bindgen
#[wasm_bindgen]
#[derive(Debug, PartialEq, Clone)]
pub struct Vector3 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

#[wasm_bindgen]
impl Vector3 {
    pub fn new(x: f32, y: f32, z: f32) -> Vector3 {
        Vector3 { x, y, z }
    }
}

pub trait ConvertibleVec3 {
    fn to_vec3(self) -> Vec3;
    fn from_vec3(vec: Vec3) -> Vector3;
}

impl ConvertibleVec3 for Vector3 {
    fn to_vec3(self) -> Vec3 {
        Vec3::new(self.x, self.y, self.z)
    }

    fn from_vec3(vec: Vec3) -> Vector3 {
        Vector3 {
            x: vec.x,
            y: vec.y,
            z: vec.z,
        }
    }
}
