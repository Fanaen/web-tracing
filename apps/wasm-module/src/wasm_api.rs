use crate::pathtracer::camera::{Camera, HitableShape};
use crate::pathtracer::PathTracer;
use crate::utils::set_panic_hook;
use crate::pathtracer::material::LambertianMaterial;
use crate::pathtracer::sphere::Sphere;
use nalgebra_glm::Vec3;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Context {
    pub camera_pos: Vector3,
    pub camera_rotation: Vector3,
    pub camera_fov: f32,
    pub sample_per_pixel: u16,
    pathtracer: PathTracer
}

#[wasm_bindgen]
impl Context {
    pub fn new() -> Context {
        set_panic_hook();

        let camera = Camera::new(
            Vec3::new(0.0, 0.0, 0.0),
            Vec3::new(0.0, 0.0, 0.0),
            45.,
            320,
            160,
        );

        let pathtracer = PathTracer::new(camera, 1);

        Context {
            camera_pos: Vector3::new(0.0, 0.0, 0.0),
            camera_rotation: Vector3::new(0.0, 0.0, 0.0),
            camera_fov: 0.0,
            sample_per_pixel: 1,
            pathtracer
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

        self.pathtracer.camera = camera;
        self.pathtracer.samples = self.sample_per_pixel;

        // Call the pathtracer once per pixel and build the image
        let data_size = (tile_size * tile_size) as usize;
        let mut data = Vec::with_capacity(data_size);

        for y in (tile_y..(tile_y + tile_size)).rev() {
            for x in tile_x..(tile_x + tile_size) {
                let col = self.pathtracer.compute_pixel(x, y);
                data.push((255.99 * col.x.sqrt()) as u8);
                data.push((255.99 * col.y.sqrt()) as u8);
                data.push((255.99 * col.z.sqrt()) as u8);
                data.push(255);
            }
        }

        Ok(data)
    }

    pub fn add_sphere(&mut self, id: u32, x: f32, y: f32, z: f32, radius: f32) {
        self.pathtracer.world.add(Sphere::new(
            id,
            Vec3::new(x, y, z),
            radius,
            LambertianMaterial {
                albedo: Vec3::new(0.5, 0.5, 0.5),
            }.into(),
        ).into());
    }

    pub fn update_sphere(&mut self, id: u32, x: f32, y: f32, z: f32, radius: f32) -> bool {
        if let Some(shape) = self.pathtracer.world.find(id) {

            match shape {
                HitableShape::Sphere(sphere) => {
                    sphere.center.x = x;
                    sphere.center.y = y;
                    sphere.center.z = z;
                    sphere.radius = radius;
                }
            }

            true
        }
        else {
            false
        }
    }

    pub fn remove_sphere(&mut self, id: u32) {
        self.pathtracer.world.remove(id);
    }

    pub fn set_lambert(&mut self, id: u32, r: u32, g: u32, b: u32) -> bool {
        if let Some(shape) = self.pathtracer.world.find(id) {

            match shape {
                HitableShape::Sphere(sphere) => {
                    sphere.material = LambertianMaterial {
                        albedo: Vec3::new(r as f32 / 255.9, g as f32 / 255.9, b as f32 / 255.9),
                    }.into();
                }
            }

            true
        }
        else {
            false
        }
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
