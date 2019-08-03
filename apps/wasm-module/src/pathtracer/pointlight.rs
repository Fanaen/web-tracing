use nalgebra_glm::Vec3;
use rand::rngs::SmallRng;
use rand::Rng;

pub struct PointLight {
    id: u32,
    pub intensity: f32,
    pub position: Vec3,
}

impl PointLight {
    pub fn new(id: u32, position: Vec3, intensity: f32) -> PointLight {
        PointLight {
            id,
            intensity,
            position
        }
    }

    fn id(&self) -> u32 {
        self.id
    }
}

pub struct LightList {
    list: Vec<PointLight>,
}

impl LightList {
    pub fn new() -> LightList {
        LightList {
            list: Vec::<PointLight>::new(),
        }
    }

    pub fn add(&mut self, light: PointLight) {
        self.list.push(light);
    }

    pub fn find(&mut self, id: u32) -> Option<&mut PointLight> {
        self.list.iter_mut().find(|light| light.id() == id)
    }

    pub fn remove(&mut self, id: u32) {
        self.list.retain(|light| light.id() != id);
    }

    pub fn pick(&self, rng: &mut SmallRng) -> Option<&PointLight> {
        if self.list.len() > 0 {
            let i = rng.gen_range(0, self.list.len());
            Some(&self.list[i])
        } else {
            None
        }
    }
}