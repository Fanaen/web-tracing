use crate::pathtracer::camera::{Camera, Ray};
use crate::pathtracer::material::{
    DielectricMaterial, LambertianMaterial, MaterialTrait, MetalMaterial,
};
use crate::pathtracer::sphere::Sphere;
use crate::pathtracer::hit::HitableList;
use crate::pathtracer::pointlight::LightList;

use nalgebra_glm::Vec3;
use rand::rngs::SmallRng;
use rand::Rng;
use rand_core::SeedableRng;
use nalgebra_glm::length2;

pub mod camera;
pub mod hit;
pub mod material;
pub mod math;
pub mod sphere;
pub mod triangle;
pub mod pointlight;

pub struct PathTracer {
    rng: SmallRng,
    pub camera: Camera,
    pub samples: u16,
    pub world: HitableList,
    pub lights: LightList
}

impl PathTracer {
    pub fn new(camera: Camera, samples: u16) -> PathTracer {
        PathTracer {
            camera,
            rng: SmallRng::seed_from_u64(0),
            samples,
            world: HitableList::new(),
            lights: LightList::new()
        }
    }

    pub fn compute_pixel(&mut self, x: u32, y: u32) -> Vec3 {
        let mut col = Vec3::new(0., 0., 0.);
        for _ in 0..self.samples {
            let u = (x as f32 + self.rng.gen_range(0., 1.)) / self.camera.width as f32;
            let v = (y as f32 + self.rng.gen_range(0., 1.)) / self.camera.height as f32;
            let ray = self.camera.get_ray(u, v);
            col = col + color(ray, &self.world, &self.lights, &mut self.rng, 0);
        }

        col / self.samples as f32
    }

    pub fn random_spheres(&mut self) {
        // Le sol
        self.world.add(Sphere::new(0,
            Vec3::new(0., -1000., 0.),
            1000.,
            LambertianMaterial {
                albedo: Vec3::new(0.5, 0.5, 0.5),
            }
            .into(),
        ).into());

        for a in -11..11 {
            for b in -11..11 {
                let choose_mat: f32 = self.rng.gen_range(0., 1.);
                let center: Vec3 = Vec3::new(
                    a as f32 + 0.9 * self.rng.gen_range(0., 1.),
                    0.2,
                    b as f32 + 0.9 * self.rng.gen_range(0., 1.),
                );

                if (center - Vec3::new(4., 0.2, 0.)).magnitude() > 0.9 {
                    if choose_mat < 0.8 {
                        self.world.add(Sphere::new(0,
                            center,
                            0.2,
                            LambertianMaterial {
                                albedo: Vec3::new(
                                    self.rng.gen_range(0., 1.) * self.rng.gen_range(0., 1.),
                                    self.rng.gen_range(0., 1.) * self.rng.gen_range(0., 1.),
                                    self.rng.gen_range(0., 1.) * self.rng.gen_range(0., 1.),
                                ),
                            }
                            .into(),
                        ).into());
                    } else if choose_mat < 1. {
                        self.world.add(Sphere::new(0,
                            center,
                            0.2,
                            MetalMaterial {
                                albedo: Vec3::new(
                                    0.5 * (1. + self.rng.gen_range(0., 1.)),
                                    0.5 * (1. + self.rng.gen_range(0., 1.)),
                                    0.5 * (1. + self.rng.gen_range(0., 1.)),
                                ),
                                fuzz: 0.5 * self.rng.gen_range(0., 1.),
                            }
                            .into(),
                        ).into());
                    } else {
                        self.world.add(Sphere::new(0,
                            center,
                            0.2,
                            DielectricMaterial { refract_index: 1.5 }.into(),
                        ).into());
                    }
                }
            }
        }

        self.world.add(Sphere::new(0,
            Vec3::new(-4., 1., 0.),
            1.,
            LambertianMaterial {
                albedo: Vec3::new(0.4, 0.2, 0.1),
            }
            .into(),
        ).into());
        self.world.add(Sphere::new(0,
            Vec3::new(4., 1., 0.),
            1.,
            MetalMaterial {
                albedo: Vec3::new(0.7, 0.6, 0.5),
                fuzz: 0.,
            }
            .into(),
        ).into());
        self.world.add(Sphere::new(0,
            Vec3::new(0., 2., 0.),
            1.,
            DielectricMaterial { refract_index: 1.5 }.into(),
        ).into());
    }
}

pub fn random_in_unit_sphere(rng: &mut SmallRng) -> Vec3 {
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

/// Compute the color for a given camera ray.
pub fn color(ray: Ray, world: &HitableList, lights: &LightList, rng: &mut SmallRng, depth: i32) -> Vec3 {
    // Recursion lock.
    if depth >= 10 {
        return Vec3::new(0., 0., 0.)
    }

    // Intersect the camera ray with the scene.
    match world.hit(&ray, 0.001, std::f32::MAX) {
        // The ray hits something.
        Option::Some(hit) => {

            // Compute direct lighting.
            // Pick a random light.
            let direct_lighting = match lights.pick(rng) {
                Some(light) => {
                    let light_pos = &light.position;
                    let intensity = &light.intensity;

                    // Cast a shadow ray.
                    // Check if there is an object between the light and the shading point.
                    // todo: trace more than one ray.
                    let shadow_ray_dir = light_pos - hit.point;
                    let distance_squared = length2(&shadow_ray_dir);
                    let distance = distance_squared.sqrt();
                    let light_attenuation = 1.0 / distance_squared;
                    let shadow_ray = Ray {
                        origin: hit.point,
                        direction: shadow_ray_dir / distance};
                    if world.hit(&shadow_ray, 0.001, distance + 0.001).is_some() {
                        0.0
                    } else {
                        intensity * light_attenuation
                    }
                },
                None => 0.0
            };

            // Bounce the ray.
            match hit.material.scatter(&ray, &hit, rng) {
                // The material can be scattered.
                Option::Some(scatter) => {
                    let c = color(scatter.scattered, world, lights, rng, depth + 1);
                    Vec3::new(
                        direct_lighting + scatter.attenuation.x * c.x,
                        direct_lighting + scatter.attenuation.y * c.y,
                        direct_lighting + scatter.attenuation.z * c.z)
                }
                // The material cannot be scattered.
                Option::None => {
                    Vec3::new(0., 0., 0.)
                }
            }
        }
        // The ray doesn't hit anything.
        Option::None => {
            let unit_direction = ray.direction.normalize();
            let t = 0.5 * (unit_direction.y + 1.);
            (1. - t) * Vec3::new(1., 1., 1.) + (t * Vec3::new(0.5, 0.7, 1.))
        }
    }
}
