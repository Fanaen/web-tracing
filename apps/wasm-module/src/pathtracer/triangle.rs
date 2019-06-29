use crate::pathtracer::camera::Ray;
use crate::pathtracer::material::Material;
use nalgebra_glm::Vec3;
use crate::pathtracer::hit::{Hit, Hitable};

pub struct Triangle {
    id: u32,
    pub vertex_a: Vec3,
    pub vertex_b: Vec3,
    pub vertex_c: Vec3,
    pub material: Material,
}

impl Triangle {
    pub fn new(id: u32, vertex_a: Vec3, vertex_b: Vec3, vertex_c: Vec3, material: Material) -> Triangle {
        Triangle {
            id,
            vertex_a,
            vertex_b,
            vertex_c,
            material,
        }
    }
}

impl Hitable for Triangle {
    fn hit(&self, ray: &Ray, t_min: f32, t_max: f32) -> Option<Hit> {
        // Source: https://en.wikipedia.org/wiki/M%C3%B6ller%E2%80%93Trumbore_intersection_algorithm
        //
        //        + a
        //        |\
        //        | \
        //  v0v1  |  \ v0v2
        //        |   \
        //        |    \
        //        |     \
        //      b +------+ c

        let v0v1: Vec3 = self.vertex_b - self.vertex_a;
        let v0v2: Vec3 = self.vertex_c - self.vertex_a;
        const K_EPSILON: f32 = 0.0000001;

        let plane: Vec3 = ray.direction.cross(&v0v2);
        let angle_triangle_to_camera: f32 = v0v1.dot(&plane);

        // Parallel ?
        // To enable backface culling, remove the "angle_triangle_to_camera >= 0.0" check.
        if angle_triangle_to_camera < K_EPSILON && angle_triangle_to_camera >= 0.0 {
            return None;
        }

        let f: f32 = 1. / angle_triangle_to_camera;
        let s: Vec3 = ray.origin - self.vertex_a;
        let u: f32 = f * s.dot(&plane);

        if u < 0. || u > 1. {
            return None;
        }

        let q: Vec3 = s.cross(&v0v1);
        let v: f32 = f * ray.direction.dot(&q);

        if v < 0. || u + v > 1. {
            return None;
        }

        let t: f32 = f * v0v2.dot(&q);

        // Is the triangle behind us or outside bounds of the test
        if t <= 0. || t < t_min || t >= t_max {
            return None;
        }

        let normal: Vec3 = v0v1.cross(&v0v2).normalize();

        Some(Hit {
            t,
            point: ray.point_at_parameter(t),
            normal,
            material: self.material.clone()
        })
    }

    fn id(&self) -> u32 {
        self.id
    }
}
