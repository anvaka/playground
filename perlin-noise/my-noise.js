export default class Noise {
  constructor(seed) {
    this.seed = seed ||42;// Math.random();
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
  return ((Math.sin(x * 357.9 + y * 1124.6) * seed * 345678.5432101) % 1);
}

function dotWithGradientVector(x, y, vx, vy, seed) {
  let theta = hash(vx, vy, seed) * Math.PI * 2;
  return (x - vx) * Math.cos(theta) + (y - vy) * Math.sin(theta);
}

function smootherStep(x){
  // return generalSmoothStep(10, x);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function interpolate(x, a, b) {
  return a + smootherStep(x) * (b - a);
}

// general smooth is taken from https://en.wikipedia.org/wiki/Smoothstep
function generalSmoothStep(N, x) {
  var result = 0;
  for (var n = 0; n <= N; ++n)
    result += pascalTriangle(-N - 1, n) *
              pascalTriangle(2 * N + 1, N - n) *
              Math.pow(x, N + n + 1);
  return result;
}

// Returns binomial coefficient without explicit use of factorials,
// which can't be used with negative integers
function pascalTriangle(a, b) {
  var result = 1; 
  for (var i = 0; i < b; ++i)
    result *= (a - i) / (i + 1);
  return result;
}