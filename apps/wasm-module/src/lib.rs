pub mod intersections;
mod utils;

use std::ops::Add;
use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;
use web_sys::{CanvasRenderingContext2d, ImageData};
use nalgebra_glm::Vec3;
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
pub fn benchmark(origin: Vector3) -> u32 {
    100
}

//fn does_intersect(origin: &Vec3, direction: &Vec3) -> bool {
//    // analytic solution
//    let L: Vec3 = orig;
//    let a: f32 = dir.dotProduct(dir);
//    let b: f32 = 2 * dir.dotProduct(L);
//    let c: f32 = L.dotProduct(L) - radius2;
//    if (!solveQuadratic(a, b, c, t0, t1)) return false;
//
//    if (t0 > t1) std::swap(t0, t1);
//
//    if (t0 < 0) {
//        t0 = t1; // if t0 is negative, let's use t1 instead
//        if (t0 < 0) return false; // both t0 and t1 are negative
//    }
//
//    t = t0;
//
//    true
//}


#[wasm_bindgen]
pub fn draw(
    ctx: &CanvasRenderingContext2d,
    width: u32,
    height: u32,
    camera_pos: Vector3
) -> Result<(), JsValue> {
    let camera_pos = camera_pos.to_vec3();

    let mut data = Vec::new();

    for x in 0..width {
        for y in 0..height {
            data.push(clamp(camera_pos.x, 0., 255.) as u8);
            data.push(clamp(camera_pos.y, 0., 255.) as u8);
            data.push(clamp(camera_pos.z, 0., 255.) as u8);
            data.push(255);
        }
    }

    let data = ImageData::new_with_u8_clamped_array_and_sh(Clamped(&mut data), width, height)?;
    ctx.put_image_data(&data, 0.0, 0.0,)
}

pub fn clamp(value: f32, min: f32, max: f32) -> f32 {
    if value > max { max } else if value < min { min } else { value }
}