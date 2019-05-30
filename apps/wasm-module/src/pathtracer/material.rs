use crate::pathtracer::camera::{Hit, Ray};
use crate::pathtracer::random_in_unit_sphere;
use nalgebra_glm::{dot, Vec3};
use rand::prelude::ThreadRng;
use rand::Rng;

#[derive(Clone)]
pub enum Material {
    Lambert(LambertianMaterial),
    Metal(MetalMaterial),
    Dielectric(DielectricMaterial),
}

pub trait MaterialTrait {
    fn scatter(&self, ray: &Ray, hit: &Hit, rng: &mut ThreadRng) -> Option<ScatterResult>;
}

pub struct ScatterResult {
    pub attenuation: Vec3,
    pub scattered: Ray,
}

impl MaterialTrait for Material {
    fn scatter(&self, ray: &Ray, hit: &Hit, rng: &mut ThreadRng) -> Option<ScatterResult> {
        match self {
            Material::Lambert(lambert) => lambert.scatter(ray, hit, rng),
            Material::Metal(metal) => metal.scatter(ray, hit, rng),
            Material::Dielectric(dielectric) => dielectric.scatter(ray, hit, rng),
        }
    }
}

#[derive(Clone)]
pub struct LambertianMaterial {
    pub albedo: Vec3,
}

impl MaterialTrait for LambertianMaterial {
    fn scatter(&self, _ray: &Ray, hit: &Hit, rng: &mut ThreadRng) -> Option<ScatterResult> {
        let target: Vec3 = hit.point + hit.normal + random_in_unit_sphere(rng);
        let scattered = Ray {
            origin: hit.point,
            direction: target - hit.point,
        };
        let attenuation = self.albedo;
        Some(ScatterResult {
            attenuation,
            scattered,
        })
    }
}

#[derive(Clone)]
pub struct MetalMaterial {
    pub albedo: Vec3,
    pub fuzz: f32,
}

fn reflect(v: &Vec3, normal: &Vec3) -> Vec3 {
    v - 2. * dot(v, normal) * normal
}

impl MaterialTrait for MetalMaterial {
    fn scatter(&self, ray: &Ray, hit: &Hit, rng: &mut ThreadRng) -> Option<ScatterResult> {
        let reflected: Vec3 = reflect(&ray.direction.normalize(), &hit.normal);
        let scattered = Ray {
            origin: hit.point,
            direction: reflected + self.fuzz * random_in_unit_sphere(rng),
        };
        let attenuation = self.albedo;

        if dot(&scattered.direction, &hit.normal) > 0. {
            Some(ScatterResult {
                attenuation,
                scattered,
            })
        } else {
            None
        }
    }
}

#[derive(Clone)]
pub struct DielectricMaterial {
    pub refract_index: f32,
}

pub fn refract(v: &Vec3, normal: &Vec3, ni_over_nt: f32) -> Option<Vec3> {
    let uv: Vec3 = v.normalize();
    let dt: f32 = dot(&uv, &normal);
    let discriminant: f32 = 1.0 - ni_over_nt * ni_over_nt * (1. - dt * dt);
    if discriminant > 0. {
        Some(ni_over_nt * (uv - normal * dt) - normal * discriminant.sqrt())
    } else {
        None
    }
}

pub fn schlick(cosine: f32, refract_index: f32) -> f32 {
    let mut r0: f32 = (1. - refract_index) / (1. + refract_index);
    r0 = r0 * r0;
    r0 + (1. - r0) * (1. - cosine).powf(5.)
}

impl MaterialTrait for DielectricMaterial {
    fn scatter(&self, ray: &Ray, hit: &Hit, rng: &mut ThreadRng) -> Option<ScatterResult> {
        let outward_normal: Vec3;
        let ni_over_nt: f32;
        let cosine: f32;

        let scattered: Ray;

        if dot(&ray.direction, &hit.normal) > 0. {
            outward_normal = -hit.normal;
            ni_over_nt = self.refract_index;
            cosine =
                self.refract_index * dot(&ray.direction, &hit.normal) / ray.direction.magnitude();
        } else {
            outward_normal = hit.normal;
            ni_over_nt = 1. / self.refract_index;
            cosine = -dot(&ray.direction, &hit.normal) / ray.direction.magnitude();
        }

        let refracted = refract(&ray.direction, &outward_normal, ni_over_nt);

        if refracted.is_some() {
            let reflect_prob = schlick(cosine, self.refract_index);
            if rng.gen_range(0., 1.) < reflect_prob {
                scattered = Ray {
                    origin: hit.point,
                    direction: reflect(&ray.direction, &hit.normal),
                };
            } else {
                scattered = Ray {
                    origin: hit.point,
                    direction: refracted.unwrap(),
                };
            }
        } else {
            scattered = Ray {
                origin: hit.point,
                direction: reflect(&ray.direction, &hit.normal),
            };
        }

        Some(ScatterResult {
            attenuation: Vec3::new(1., 1., 1.),
            scattered,
        })
    }
}
