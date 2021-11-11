export default class Noise {
  constructor(seed) {
    this.seed = seed || Math.random();
  }

  get(x, y) {
    let xf = Math.floor(x);
    let yf = Math.floor(y);

    let topLeft     = dotWithGradientVector(x, y, xf + 0, yf + 0, this.seed);
    let topRight    = dotWithGradientVector(x, y, xf + 1, yf + 0, this.seed);
    let bottomLeft  = dotWithGradientVector(x, y, xf + 0, yf + 1, this.seed);
    let bottomRight = dotWithGradientVector(x, y, xf + 1, yf + 1, this.seed);

    let xTop = interpolate(x - xf, topLeft, topRight);
    let xBottom = interpolate(x - xf, bottomLeft, bottomRight);
    return (interpolate(y - yf, xTop, xBottom) + 1)/2
  }
} 

function hash(x, y, seed) {
  let px = x * 123.4 + y * 567.8;
  let py = x * 234.5 + y * 456.7;

  return ((Math.sin(px + py) * seed * 45678.5432101) % 1) * Math.PI * 2;
}

function dotWithGradientVector(x, y, vx, vy, seed) {
  let theta = hash(vx, vy, seed);
  return (x - vx) * Math.cos(theta) + (y - vy) * Math.sin(theta);
}

function smootherStep(x){
  return 6*x**5 - 15*x**4 + 10*x**3;
}

function interpolate(x, a, b) {
  return a + smootherStep(x) * (b-a);
}
  