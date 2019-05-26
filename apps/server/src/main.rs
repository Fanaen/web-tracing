use std::time::{Duration, Instant};
use web_tracing::benchmark;
use web_tracing::intersections::Vector3;

fn main() {
    let start = Instant::now();
    let mut result = 0;

    for _ in 0..1000 {
        result += benchmark(Vector3::new(0., 0., 0.));
    }

    let duration = start.elapsed();
    println!("Result: {} ({:?} per iteration)", result, duration / 1000);
}