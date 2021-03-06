use wasm_bindgen::prelude::*;
use nalgebra_glm::Vec3;
use nalgebra_glm::sqrt;
use crate::pathtracer::camera::{Camera};
use crate::pathtracer::PathTracer;
use crate::utils::set_panic_hook;
use crate::pathtracer::material::LambertianMaterial;
use crate::pathtracer::hit::HitableShape;
use crate::pathtracer::math::saturate;
use crate::pathtracer::sphere::Sphere;
use crate::pathtracer::triangle::Triangle;
use crate::pathtracer::pointlight::PointLight;

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
                let better_color = saturate(sqrt(&col));
                data.push((255.99 * better_color.x) as u8);
                data.push((255.99 * better_color.y) as u8);
                data.push((255.99 * better_color.z) as u8);
                data.push(255);
            }
        }

        Ok(data)
    }

    /// Create a new light or edit an existing one.
    pub fn create_or_edit_light(&mut self, id: u32, x: f32, y: f32, z: f32, intensity: f32)
    {
        // Check if the light already exists.
        match self.pathtracer.lights.find(id) {
            // Edit the light.
            Some(light) => {
                light.position.x = x;
                light.position.y = y;
                light.position.z = z;
                light.intensity = intensity;
            },
            // Create a new light.
            None => {
                let light = PointLight::new(
                    id,
                    Vec3::new(x, y, z),
                    intensity);
                self.pathtracer.lights.add(light.into());
            }
        }
    }

    pub fn remove_light(&mut self, id: u32) {
        self.pathtracer.lights.remove(id);
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
                },
                _ => ()
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


    pub fn add_triangle(&mut self,
                        id: u32,
                        a_x: f32,
                        a_y: f32,
                        a_z: f32,
                        b_x: f32,
                        b_y: f32,
                        b_z: f32,
                        c_x: f32,
                        c_y: f32,
                        c_z: f32) {
        self.pathtracer.world.add(Triangle::new(
            id,
            Vec3::new(a_x, a_y, a_z),
            Vec3::new(b_x, b_y, b_z),
            Vec3::new(c_x, c_y, c_z),
            LambertianMaterial {
                albedo: Vec3::new(0.5, 0.5, 0.5),
            }.into(),
        ).into());
    }

    pub fn update_triangle(&mut self,
                           id: u32,
                           a_x: f32,
                           a_y: f32,
                           a_z: f32,
                           b_x: f32,
                           b_y: f32,
                           b_z: f32,
                           c_x: f32,
                           c_y: f32,
                           c_z: f32
    ) -> bool {
        if let Some(shape) = self.pathtracer.world.find(id) {

            match shape {
                HitableShape::Triangle(triangle) => {
                    triangle.vertex_a.x = a_x;
                    triangle.vertex_a.y = a_y;
                    triangle.vertex_a.z = a_z;
                    triangle.vertex_b.x = b_x;
                    triangle.vertex_b.y = b_y;
                    triangle.vertex_b.z = b_z;
                    triangle.vertex_c.x = c_x;
                    triangle.vertex_c.y = c_y;
                    triangle.vertex_c.z = c_z;
                },
                _ => ()
            }

            true
        }
        else {
            false
        }
    }

    pub fn remove_triangle(&mut self, id: u32) {
        self.pathtracer.world.remove(id);
    }

    pub fn add_model(&mut self, id: u32, x: f32, y: f32, z: f32,
                     vertices: Vec<f32>,
                     triangles: Vec<u16>) {
        self.remove_model(id);
        let pos = Vec3::new(x, y, z);
        for vertex in vertices.chunks(9) {
            assert_eq!(vertex.len(), 9);
            self.pathtracer.world.add(Triangle::new(
                id,
                Vec3::new(vertex[0], vertex[1],vertex[2]),
                Vec3::new(vertex[3], vertex[4],vertex[5]),
                Vec3::new(vertex[6], vertex[7],vertex[8]),
                LambertianMaterial {
                    albedo: Vec3::new(0.5, 0.5, 0.5),
                }.into(),
            ).into());
        }
        log(self.pathtracer.world.stats().as_str());
//        for triangle in triangles.chunks(3) {
//            assert_eq!(triangle.len(), 3);
//            self.pathtracer.world.add(Triangle::new(
//                id,
//                extract_triangle(&vertices, triangle[0]),
//                extract_triangle(&vertices, triangle[1]),
//                extract_triangle(&vertices, triangle[2]),
//                LambertianMaterial {
//                    albedo: Vec3::new(0.5, 0.5, 0.5),
//                }.into(),
//            ).into());
//        }
    }

    pub fn update_model(&mut self, id: u32, x: f32, y: f32, z: f32,
                        vertices: Vec<f32>,
                        triangles: Vec<u16>) -> bool {
        self.remove_model(id);
        self.add_model(id, x, y, z, vertices, triangles);
        log(self.pathtracer.world.stats().as_str());
        true
    }

    pub fn remove_model(&mut self, id: u32) {
        self.pathtracer.world.remove(id);
    }

    pub fn set_lambert(&mut self, id: u32, r: u32, g: u32, b: u32) -> bool {
        if let Some(shape) = self.pathtracer.world.find(id) {

            match shape {
                HitableShape::Sphere(sphere) => {
                    sphere.material = LambertianMaterial {
                        albedo: Vec3::new(r as f32 / 255.9, g as f32 / 255.9, b as f32 / 255.9),
                    }.into();
                },
                HitableShape::Triangle(triangle) => {
                    triangle.material = LambertianMaterial {
                        albedo: Vec3::new(r as f32 / 255.9, g as f32 / 255.9, b as f32 / 255.9),
                    }.into();
                },
            }

            true
        }
        else {
            false
        }
    }
}

fn extract_triangle(vertices: &Vec<f32>, index: u16) -> Vec3 {
    let index = index as usize;
    Vec3::new(
        vertices[index],
        vertices[index + 1],
        vertices[index + 2],
    )
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

#[wasm_bindgen]
extern "C" {
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    // The `console.log` is quite polymorphic, so we can bind it with multiple
    // signatures. Note that we need to use `js_name` to ensure we always call
    // `log` in JS.
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_u32(a: u32);

    // Multiple arguments too!
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_many(a: &str, b: &str);
}
