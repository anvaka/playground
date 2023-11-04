import { Vector, Point } from '../src/tuple.js';
import { Canvas } from '../src/canvas.js';
import { Color } from '../src/color.js';

const start = new Point(0, 1, 0);
const velocity = new Vector(1, 1.8, 0).normalize().multiply(11.25);
let p = projectile(start, velocity);

const gravity = new Vector(0, -0.1, 0);
const wind = new Vector(-0.01, 0, 0);

const e = environment(gravity, wind);
let maxX = 0;
let maxY = 0;
simulate(p, e, (p) => {
  maxX = Math.max(p.position.x, maxX);
  maxY = Math.max(p.position.y, maxY);
});

const canvas = new Canvas(Math.ceil(maxX) + 1, Math.ceil(maxY) + 1);
simulate(p, e, (p) => {
  canvas.writePixel(p.position.x, canvas.height - p.position.y, new Color(1, 0, 0));
});

console.log(canvas.toPPM());

function simulate(p, e, onTick) {
  while (p.position.y > 0) {
    p = tick(e, p);
    onTick(p);
  }
}

function tick(env, proj) {
  const position = proj.position.add(proj.velocity);
  const velocity = proj.velocity.add(env.gravity).add(env.wind);
  return projectile(position, velocity);
}


function projectile(position, velocity) {
  return {
    position,
    velocity
  };
}

function environment(gravity, wind) {
  return {
    gravity,
    wind
  };
}