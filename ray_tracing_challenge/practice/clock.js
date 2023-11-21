import { translation, rotationZ, scaling } from '../src/transformation.js';
import { Canvas } from '../src/canvas.js';
import { Point } from '../src/tuple.js';
import { Color } from '../src/color.js';

const canvas = new Canvas(100, 100);
const white = new Color(1, 1, 1);

for (let i = 0 ; i < 12; ++i) {
  const angle = Math.PI / 6 * i;
  const point = new Point(0, 1, 0);
  const transform = translation(50, 50, 0).multiply(scaling(25, 25, 1)).multiply(rotationZ(angle));
  const coord = transform.multiply(point);
  canvas.writePixel(coord.x, canvas.height - coord.y, white);
}

console.log(canvas.toPPM());
