use crate::intersections::{Hit, Ray};
use crate::random_in_unit_sphere;
use nalgebra_glm::{dot, Vec3};
use rand::prelude::ThreadRng;

#[derive(Clone)]
pub enum Material {
    Lambert(LambertianMaterial),
    Metal(MetalMaterial),
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
        }
    }
}

#[derive(Clone)]
pub struct LambertianMaterial {
    pub albedo: Vec3,
}

impl MaterialTrait for LambertianMaterial {
    fn scatter(&self, ray: &Ray, hit: &Hit, rng: &mut ThreadRng) -> Option<ScatterResult> {
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
}

fn reflect(v: &Vec3, normal: &Vec3) -> Vec3 {
    v - 2. * dot(v, normal) * normal
}

impl MaterialTrait for MetalMaterial {
    fn scatter(&self, ray: &Ray, hit: &Hit, rng: &mut ThreadRng) -> Option<ScatterResult> {
        let reflected: Vec3 = reflect(&ray.direction.normalize(), &hit.normal);
        let scattered = Ray {
            origin: hit.point,
            direction: reflected,
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
