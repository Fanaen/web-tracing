use std::ops::{Add, Mul, Sub};
use wasm_bindgen::prelude::*;
use nalgebra_glm::Vec3;

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
        Vector3 { x: vec.x, y: vec.y, z: vec.z }
    }
}
