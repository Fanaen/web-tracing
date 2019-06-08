use crate::pathtracer::camera::{Camera, Hitable, HitableList, Ray};
use crate::pathtracer::material::{
    DielectricMaterial, LambertianMaterial, MaterialTrait, MetalMaterial,
};
use crate::pathtracer::sphere::Sphere;
use nalgebra_glm::Vec3;
use rand::rngs::SmallRng;
use rand::Rng;
use rand_core::SeedableRng;

pub mod camera;
mod material;
mod sphere;

pub struct PathTracer {
    rng: SmallRng,
    camera: Camera,
    samples: u16,
    world: HitableList,
}

impl PathTracer {
    pub fn new(camera: Camera, samples: u16) -> PathTracer {
        PathTracer {
            camera,
            rng: SmallRng::seed_from_u64(0),
            samples,
            world: HitableList::new(),
        }
    }

    pub fn compute_pixel(&mut self, x: u32, y: u32) -> Vec3 {
        let mut col = Vec3::new(0., 0., 0.);
        for _ in 0..self.samples {
            let u = (x as f32 + self.rng.gen_range(0., 1.)) / self.camera.width as f32;
            let v = (y as f32 + self.rng.gen_range(0., 1.)) / self.camera.height as f32;
            let ray = self.camera.get_ray(u, v);
            col = col + color(ray, &self.world, &mut self.rng, 0);
        }

        col / self.samples as f32
    }

    pub fn random_spheres(&mut self) {
        // Le sol
        self.world.add(Box::from(Sphere::new(
            Vec3::new(0., -1000., 0.),
            1000.,
            LambertianMaterial {
                albedo: Vec3::new(0.5, 0.5, 0.5),
            }
            .into(),
        )));

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
                        self.world.add(Box::from(Sphere::new(
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
                        )));
                    } else if choose_mat < 1. {
                        self.world.add(Box::from(Sphere::new(
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
                        )));
                    } else {
                        self.world.add(Box::from(Sphere::new(
                            center,
                            0.2,
                            DielectricMaterial { refract_index: 1.5 }.into(),
                        )));
                    }
                }
            }
        }

        self.world.add(Box::from(Sphere::new(
            Vec3::new(-4., 1., 0.),
            1.,
            LambertianMaterial {
                albedo: Vec3::new(0.4, 0.2, 0.1),
            }
            .into(),
        )));
        self.world.add(Box::from(Sphere::new(
            Vec3::new(4., 1., 0.),
            1.,
            MetalMaterial {
                albedo: Vec3::new(0.7, 0.6, 0.5),
                fuzz: 0.,
            }
            .into(),
        )));
        self.world.add(Box::from(Sphere::new(
            Vec3::new(0., 2., 0.),
            1.,
            DielectricMaterial { refract_index: 1.5 }.into(),
        )));
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

pub fn color(ray: Ray, world: &HitableList, rng: &mut SmallRng, depth: i32) -> Vec3 {
    match world.hit(&ray, 0.001, std::f32::MAX) {
        Option::Some(hit) => {
            if depth < 10 {
                if let Option::Some(scatter) = hit.material.scatter(&ray, &hit, rng) {
                    let c = color(scatter.scattered, world, rng, depth + 1);
                    Vec3::new(
                        scatter.attenuation.x * c.x,
                        scatter.attenuation.y * c.y,
                        scatter.attenuation.z * c.z,
                    )
                } else {
                    Vec3::new(0., 0., 0.)
                }
            } else {
                Vec3::new(0., 0., 0.)
            }
        }
        Option::None => {
            // On affiche le fond sinon
            let unit_direction = ray.direction.normalize();
            let t = 0.5 * (unit_direction.y + 1.);
            (1. - t) * Vec3::new(1., 1., 1.) + (t * Vec3::new(0.5, 0.7, 1.))
        }
    }
}
