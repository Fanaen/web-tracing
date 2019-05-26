mod utils;
pub mod intersections;

use wasm_bindgen::prelude::*;
use intersections::Vector3;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, web-tracing!");
}

#[wasm_bindgen]
pub fn benchmark(origin: Vector3) -> u32 { // , direction: Vector3
    let mut intersections = 0;

    for i in 0..1000 {
        if dist_to_sphere(origin.clone(), Vector3 { x: i as f32, y: i as f32, z: i as f32}, 1.0).abs() < 20.0 {
            intersections += 1;
        }
    }

    intersections
}

//fn does_intersect(origin: &Vector3, direction: &Vector3) -> bool {
//    // analytic solution
//    let L: Vector3 = orig;
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

fn dist_to_sphere(p: Vector3, c: Vector3, r: f32) -> f32 {
    (p - c).length() - r
}


