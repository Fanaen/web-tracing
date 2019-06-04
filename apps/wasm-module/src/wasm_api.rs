use crate::pathtracer::camera::Camera;
use crate::pathtracer::PathTracer;
use crate::utils::set_panic_hook;
use nalgebra_glm::Vec3;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Context {
    pub camera_pos: Vector3,
    pub camera_rotation: Vector3,
    pub camera_fov: f32,
    pub sample_per_pixel: u16,
}

#[wasm_bindgen]
impl Context {
    pub fn new() -> Context {
        set_panic_hook();
        Context {
            camera_pos: Vector3::new(0.0, 0.0, 0.0),
            camera_rotation: Vector3::new(0.0, 0.0, 0.0),
            camera_fov: 0.0,
            sample_per_pixel: 1,
        }
    }

    pub fn draw(
        &mut self,
        tile_x: u32,
        tile_y: u32,
        tile_size: u32,
        width: u32,
        height: u32,
    ) -> Result<Vec<u8>, JsValue> {
        let camera = Camera::new(
            self.camera_pos.into(),
            self.camera_rotation.into(),
            self.camera_fov,
            width,
            height,
        );

        let mut pathtracer = PathTracer::new(camera, self.sample_per_pixel);

        pathtracer.random_spheres();

        // Call the pathtracer once per pixel and build the image
        let data_size = (tile_size * tile_size) as usize;
        let mut data = Vec::with_capacity(data_size);

        for y in (tile_y..(tile_y + tile_size)).rev() {
            for x in tile_x..(tile_x + tile_size) {
                let col = pathtracer.compute_pixel(x, y);
                data.push((255.99 * col.x.sqrt()) as u8);
                data.push((255.99 * col.y.sqrt()) as u8);
                data.push((255.99 * col.z.sqrt()) as u8);
                data.push(255);
            }
        }

        Ok(data)
    }
}

/// Wraps around the Vec3 struct from nalgebra for wasm-bindgen
#[wasm_bindgen]
#[derive(Debug, PartialEq, Clone, Copy)]
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

impl From<Vec3> for Vector3 {
    fn from(vec: Vec3) -> Self {
        Vector3::new(vec.x, vec.y, vec.z)
    }
}

impl Into<Vec3> for Vector3 {
    fn into(self) -> Vec3 {
        Vec3::new(self.x, self.y, self.z)
    }
}
