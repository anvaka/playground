import { translation, rotationZ, scaling } from '../src/transformation.js';
import { Canvas } from '../src/canvas.js';
import { Point, Vector } from '../src/tuple.js';
import { Color } from '../src/color.js';
import { Sphere } from '../src/sphere.js';
import { Ray } from '../src/ray.js';

const canvas = new Canvas(100, 100);
const white = new Color(1, 1, 1);
const s = new Sphere();
s.transform = translation(50, 50, 0).multiply(scaling(5, 5, 5));

for (let x = 0 ; x < canvas.width; ++x) {
  for (let y = 0 ; y < canvas.height; ++y) {
    const ray = new Ray(new Point(0, 0, -5), new Vector(x, y, 1));
    const xs = s.intersect(ray);
    if (xs.length > 0) {
      canvas.writePixel(x, y, white);
    }
  }
}

console.log(canvas.toPPM());
