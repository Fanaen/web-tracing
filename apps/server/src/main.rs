#![feature(proc_macro_hygiene, decl_macro)]

#[macro_use]
extern crate rocket;
#[macro_use]
extern crate rocket_contrib;
#[macro_use]
extern crate serde_derive;
use nalgebra_glm::Vec3;
use rocket_contrib::json::{Json, JsonValue};
use rocket_cors;
use rocket_cors::Error;
use std::time::Instant;
use web_tracing::pathtracer::camera::Camera;
use web_tracing::pathtracer::PathTracer;

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Vector3 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

impl Into<Vec3> for Vector3 {
    fn into(self) -> Vec3 {
        Vec3::new(self.x, self.y, self.z)
    }
}

#[derive(Serialize, Deserialize, Debug)]
struct DrawCall {
    pub tile_x: u32,
    pub tile_y: u32,
    pub tile_size: u32,
    pub width: u32,
    pub height: u32,
    pub camera_pos: Vector3,
    pub camera_rotation: Vector3,
    pub camera_fov: f32,
}

#[post("/draw", data = "<msg>")]
fn draw(msg: Json<DrawCall>) -> JsonValue {
    let start = Instant::now();

    let camera = Camera::new(
        msg.camera_pos.clone().into(),
        msg.camera_rotation.clone().into(),
        msg.camera_fov,
        msg.width,
        msg.height,
    );

    let mut pathtracer = PathTracer::new(camera);

    pathtracer.random_spheres();

    // Call the pathtracer once per pixel and build the image
    let data_size = (msg.width * msg.height) as usize;
    let mut data = Vec::with_capacity(data_size);

    let tile_x = msg.tile_x;
    let tile_y = msg.tile_y;
    let tile_size = msg.tile_size;

    for y in (tile_y..(tile_y + tile_size)).rev() {
        for x in tile_x..(tile_x + tile_size) {
            let col = pathtracer.compute_pixel(x, y);
            data.push((255.99 * col.x.sqrt()) as u8);
            data.push((255.99 * col.y.sqrt()) as u8);
            data.push((255.99 * col.z.sqrt()) as u8);
            data.push(255);
        }
    }

    let duration = start.elapsed();
    json!({
        "image": data,
        "time": format!("{:?}", duration)
    })
}

fn main() -> Result<(), Error> {
    let cors = rocket_cors::CorsOptions {
        ..Default::default()
    }
    .to_cors()?;

    rocket::ignite()
        .mount("/", routes![draw])
        .attach(cors)
        .launch();

    Ok(())
}
