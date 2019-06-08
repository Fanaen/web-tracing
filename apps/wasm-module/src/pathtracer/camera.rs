use crate::pathtracer::material::Material;
use crate::pathtracer::sphere::Sphere;
use nalgebra_glm::{inverse, look_at, pi, rotate_vec3, vec4_to_vec3, Mat4, Vec3, Vec4};
use enum_dispatch::enum_dispatch;

pub struct Camera {
    pub origin: Vec3,
    pub lower_left_corner: Vec3,
    pub horizontal: Vec3,
    pub vertical: Vec3,

    pub width: u32,
    pub height: u32,
}

impl Camera {
    pub fn new(
        camera_pos: Vec3,
        camera_rotation: Vec3,
        camera_fov: f32,
        width: u32,
        height: u32,
    ) -> Camera {
        let camera_up = Vec3::new(0.0, 1.0, 0.0);
        let mut camera_front = Vec3::new(0.0, 0.0, -1.0);

        let axis_x = Vec3::new(1.0, 0.0, 0.0);
        let axis_y = Vec3::new(0.0, 1.0, 0.0);
        let axis_z = Vec3::new(0.0, 0.0, 1.0);

        let deg_to_radians = pi::<f32>() / 180.0;
        camera_front = rotate_vec3(&camera_front, camera_rotation.x, &axis_x);
        camera_front = rotate_vec3(&camera_front, camera_rotation.y, &axis_y);
        camera_front = rotate_vec3(&camera_front, camera_rotation.z, &axis_z);
        camera_front = camera_front.normalize();

        let camera_center = camera_pos + camera_front;
        let camera_right = camera_front.cross(&camera_up).normalize();
        let camera_up = camera_right.cross(&camera_front).normalize();

        let aspect = (width as f32) / (height as f32);
        let camera_fov = camera_fov * deg_to_radians;
        let projection_matrix = Mat4::new_perspective(aspect, camera_fov, 0.1, 10000.0);
        let view_matrix = look_at(&camera_pos, &camera_center, &camera_up);

        let mat = projection_matrix * view_matrix;
        let inverse_view_proj = inverse(&mat);

        // Compute image corners.
        let plane_lower_left = inverse_view_proj * Vec4::new(-1.0, -1.0, 0.0, 1.0);
        let plane_lower_right = inverse_view_proj * Vec4::new(1.0, -1.0, 0.0, 1.0);
        let plane_upper_left = inverse_view_proj * Vec4::new(-1.0, 1.0, 0.0, 1.0);

        // Get the framer corner in world space.
        let lower_left_corner = vec4_to_vec3(&(plane_lower_left / plane_lower_left.w));

        // Get the horizontal and vertical vectors of the frame.
        let horizontal =
            vec4_to_vec3(&(plane_lower_right / plane_lower_right.w)) - lower_left_corner;
        let vertical = vec4_to_vec3(&(plane_upper_left / plane_upper_left.w)) - lower_left_corner;

        Camera {
            origin: camera_pos,
            lower_left_corner,
            horizontal,
            vertical,

            width,
            height,
        }
    }

    pub fn get_ray(&self, u: f32, v: f32) -> Ray {
        let direction =
            self.lower_left_corner + (u * self.horizontal) + (v * self.vertical) - self.origin;
        Ray {
            origin: self.origin,
            direction: direction.normalize(),
        }
    }
}

pub struct Ray {
    pub origin: Vec3,
    pub direction: Vec3,
}

impl Ray {
    pub fn point_at_parameter(&self, t: f32) -> Vec3 {
        self.origin + (t * self.direction)
    }
}

pub struct Hit {
    pub t: f32,
    pub point: Vec3,
    pub normal: Vec3,
    pub material: Material,
}

#[enum_dispatch]
pub enum HitableShape {
    Sphere
}

#[enum_dispatch(HitableShape)]
pub trait Hitable {
    fn hit(&self, ray: &Ray, t_min: f32, t_max: f32) -> Option<Hit>;
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
}

impl Hitable for HitableList {
    fn hit(&self, ray: &Ray, t_min: f32, t_max: f32) -> Option<Hit> {
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
}
