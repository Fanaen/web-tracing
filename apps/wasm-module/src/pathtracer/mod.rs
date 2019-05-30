use crate::pathtracer::camera::{Camera, Hitable, HitableList, Ray};
use crate::pathtracer::material::{LambertianMaterial, Material, MaterialTrait, MetalMaterial};
use crate::pathtracer::sphere::Sphere;
use nalgebra_glm::Vec3;
use rand::prelude::ThreadRng;
use rand::Rng;

pub mod camera;
mod material;
mod sphere;

pub struct PathTracer {
    rng: ThreadRng,
    camera: Camera,
    samples: i32,
    world: HitableList,
}

impl PathTracer {
    pub fn new(camera: Camera) -> PathTracer {
        PathTracer {
            camera,
            rng: rand::thread_rng(),
            samples: 16,
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
            Material::Lambert(LambertianMaterial {
                albedo: Vec3::new(0.5, 0.5, 0.5),
            }),
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
                            Material::Lambert(LambertianMaterial {
                                albedo: Vec3::new(
                                    self.rng.gen_range(0., 1.) * self.rng.gen_range(0., 1.),
                                    self.rng.gen_range(0., 1.) * self.rng.gen_range(0., 1.),
                                    self.rng.gen_range(0., 1.) * self.rng.gen_range(0., 1.),
                                ),
                            }),
                        )));
                    } else if choose_mat < 1. {
                        self.world.add(Box::from(Sphere::new(
                            center,
                            0.2,
                            Material::Metal(MetalMaterial {
                                albedo: Vec3::new(
                                    0.5 * (1. + self.rng.gen_range(0., 1.)),
                                    0.5 * (1. + self.rng.gen_range(0., 1.)),
                                    0.5 * (1. + self.rng.gen_range(0., 1.)),
                                ),
                                fuzz: 0.5 * self.rng.gen_range(0., 1.),
                            }),
                        )));
                    } else {
                        //                    self.world.add(Box::from(Sphere::new(
                        //                        center,
                        //                        0.2,
                        //                        Material::Dielectric(DielectricMaterial {
                        //                            refract_index: 1.5
                        //                        }),
                        //                    )));
                    }
                }
            }
        }

        self.world.add(Box::from(Sphere::new(
            Vec3::new(-4., 1., 0.),
            1.,
            Material::Lambert(LambertianMaterial {
                albedo: Vec3::new(0.4, 0.2, 0.1),
            }),
        )));
        self.world.add(Box::from(Sphere::new(
            Vec3::new(4., 1., 0.),
            1.,
            Material::Metal(MetalMaterial {
                albedo: Vec3::new(0.7, 0.6, 0.5),
                fuzz: 0.,
            }),
        )));
        //    self.world.add(Box::from(Sphere::new(
        //        Vec3::new(0., 1., 0.),
        //        1.,
        //        Material::Dielectric(DielectricMaterial {
        //            refract_index: 1.5
        //        }),
        //    )));
    }
}

pub fn random_in_unit_sphere(rng: &mut ThreadRng) -> Vec3 {
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

pub fn color(ray: Ray, world: &HitableList, rng: &mut ThreadRng, depth: i32) -> Vec3 {
    match world.hit(&ray, 0.001, std::f32::MAX) {
        Option::Some(hit) => {
            if depth < 3 {
                if let Option::Some(scatter) = hit.material.scatter(&ray, &hit, rng) {
                    let c = color(scatter.scattered, world, rng, depth);
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
