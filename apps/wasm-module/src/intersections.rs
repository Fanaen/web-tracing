use crate::material::Material;
use nalgebra_glm::Vec3;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Debug, PartialEq, Clone)]
pub struct Vector3 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

pub trait ConvertibleVec3 {
    fn to_vec3(self) -> Vec3;
    fn from_vec3(vec: Vec3) -> Vector3;
}

#[wasm_bindgen]
impl Vector3 {
    pub fn new(x: f32, y: f32, z: f32) -> Vector3 {
        Vector3 { x, y, z }
    }
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

pub struct Ray {
    pub origin: Vec3,
    pub direction: Vec3,
}

impl Ray {
    pub fn point_at_parameter(&self, t: f32) -> Vec3 {
        self.origin + (t * self.direction)
    }
}

pub struct Hit {
    pub t: f32,
    pub point: Vec3,
    pub normal: Vec3,
    pub material: Material,
}

pub trait Hitable {
    fn hit(&self, ray: &Ray, t_min: f32, t_max: f32) -> Option<Hit>;
}

pub struct HitableList {
    list: Vec<Box<Hitable>>,
}

impl HitableList {
    pub fn new() -> HitableList {
        HitableList {
            list: Vec::<Box<Hitable>>::new(),
        }
    }

    pub fn add(&mut self, hitable: Box<Hitable>) {
        self.list.push(hitable);
    }
}

impl Hitable for HitableList {
    fn hit(&self, ray: &Ray, t_min: f32, t_max: f32) -> Option<Hit> {
        let mut closest_so_far = t_max;
        let mut closest_hit: Option<Hit> = None;

        for hitable in &self.list {
            let hit = hitable.hit(ray, t_min, closest_so_far);
            if hit.is_some() {
                let hit = hit.unwrap();
                closest_so_far = hit.t;
                closest_hit = Some(hit);
            }
        }

        closest_hit
    }
}
