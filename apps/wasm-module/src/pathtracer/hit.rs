use nalgebra_glm::Vec3;
use crate::pathtracer::material::Material;
use crate::pathtracer::camera::Ray;
use crate::pathtracer::sphere::Sphere;
use crate::pathtracer::triangle::Triangle;
use enum_dispatch::enum_dispatch;

pub struct Hit {
    pub t: f32,
    pub point: Vec3,
    pub normal: Vec3,
    pub material: Material,
}

#[enum_dispatch]
pub enum HitableShape {
    Triangle,
    Sphere,
}

#[enum_dispatch(HitableShape)]
pub trait Hitable {
    fn hit(&self, ray: &Ray, t_min: f32, t_max: f32) -> Option<Hit>;
    fn id(&self) -> u32;
}

pub struct HitableList {
    list: Vec<HitableShape>,
}

impl HitableList {
    pub fn new() -> HitableList {
        HitableList {
            list: Vec::<HitableShape>::new(),
        }
    }

    pub fn add(&mut self, hitable: HitableShape) {
        self.list.push(hitable);
    }

    pub fn find(&mut self, id: u32) -> Option<&mut HitableShape> {
        self.list.iter_mut().find(|shape| shape.id() == id)
    }

    pub fn remove(&mut self, id: u32) {
        self.list.retain(|shape| shape.id() != id);
    }

    pub fn hit(&self, ray: &Ray, t_min: f32, t_max: f32) -> Option<Hit> {
        let mut closest_so_far = t_max;
        let mut closest_hit: Option<Hit> = None;

        for hitable in &self.list {
            let hit = hitable.hit(ray, t_min, closest_so_far);
            if hit.is_some() {
                let hit = hit.unwrap();
                closest_so_far = hit.t;
                closest_hit = Some(hit);
            }
        }

        closest_hit
    }

    pub fn stats(&self) -> String {
        let mut spheres = 0;
        let mut triangles = 0;

        for shape in &self.list {
            match *shape {
                HitableShape::Sphere(_) => spheres = spheres + 1,
                HitableShape::Triangle(_) => triangles = triangles + 1,
            }
        }

        format!("{} shapes:\n * {} spheres\n * {} triangles", self.list.len(), spheres, triangles)
    }
}
