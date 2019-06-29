use crate::pathtracer::camera::Ray;
use crate::pathtracer::material::Material;
use crate::pathtracer::hit::{Hitable, Hit};
use nalgebra_glm::Vec3;

pub struct Sphere {
    id: u32,
    pub center: Vec3,
    pub radius: f32,
    pub material: Material,
}

impl Sphere {
    pub fn new(id: u32, center: Vec3, radius: f32, material: Material) -> Sphere {
        Sphere {
            id,
            center,
            radius,
            material,
        }
    }
}

impl Hitable for Sphere {
    fn hit(&self, ray: &Ray, t_min: f32, t_max: f32) -> Option<Hit> {
        let oc: Vec3 = ray.origin - self.center;
        let a: f32 = ray.direction.dot(&ray.direction);
        let b: f32 = ray.direction.dot(&oc);
        let c: f32 = oc.dot(&oc) - (self.radius * self.radius);
        let discriminant: f32 = (b * b) - (a * c);

        if discriminant > 0. {
            let rooted_discriminant = discriminant.sqrt();
            let t: f32 = (-b - rooted_discriminant) / a;

            let point = ray.point_at_parameter(t);
            if t < t_max && t > t_min {
                return Some(Hit {
                    t: t,
                    point,
                    normal: ((point - self.center) / self.radius).normalize(),
                    material: self.material.clone(),
                });
            }

            let temp: f32 = (-b + rooted_discriminant) / a;
            if temp < t_max && temp > t_min {
                let point = ray.point_at_parameter(temp);
                return Some(Hit {
                    t: temp,
                    point,
                    normal: ((point - self.center) / self.radius).normalize(),
                    material: self.material.clone(),
                });
            }
        }

        None
    }

    fn id(&self) -> u32 {
        self.id
    }
}
