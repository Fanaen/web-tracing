use crate::intersections::{Hit, Hitable, Ray};
use nalgebra_glm::{dot, Vec3};

pub struct Sphere {
    center: Vec3,
    radius: f32,
}

impl Sphere {
    pub fn new(center: Vec3, radius: f32) -> Sphere {
        Sphere { center, radius }
    }
}

impl Hitable for Sphere {
    fn hit(&self, ray: &Ray, t_min: f32, t_max: f32) -> Option<Hit> {
        let oc: Vec3 = ray.origin - self.center;
        let a: f32 = dot(&ray.direction, &ray.direction);
        let b: f32 = dot(&oc, &ray.direction);
        let c: f32 = dot(&oc, &oc) - (self.radius * self.radius);
        let discriminant: f32 = (b * b) - (a * c);

        if discriminant > 0. {
            let rootedDiscriminant = discriminant.sqrt();
            let temp: f32 = (-b - rootedDiscriminant) / a;

            let point = ray.point_at_parameter(temp);
            if temp < t_max && temp > t_min {
                return Some(Hit {
                    t: temp,
                    point,
                    normal: ((point - self.center) / self.radius).normalize(),
                });
            }

            let temp: f32 = (-b + rootedDiscriminant) / a;
            if temp < t_max && temp > t_min {
                let point = ray.point_at_parameter(temp);
                return Some(Hit {
                    t: temp,
                    point,
                    normal: ((point - self.center) / self.radius).normalize(),
                });
            }
        }

        None
    }
}
