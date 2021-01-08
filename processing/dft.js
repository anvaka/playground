// Playing with DFT for fun https://editor.p5js.org/anvaka/sketches/7OEd_1-sw
// This one renders a line
let minX = -2 * Math.PI,
  maxX = 2 * Math.PI;
let sampleCount = 300;
let coefficients;
let yValues = [];
let xValues = [];

function setup() {
  createCanvas(400, 400);
  let sample = [];
  for (let i = 0; i < sampleCount; ++i) {
    sample.push(secretFunction(minX + i * (maxX - minX) / (sampleCount)));
  }

  coefficients = dft(sample);
  yValues = [];
  xValues = [];
  let t = 0;
  let dt = TWO_PI / sampleCount;
  for (let i = 0; i < sampleCount; ++i) {
    let y = 0;
    let x = 0;
    for (let j = 0; j < sampleCount; ++j) {
      let {point: c, phase, amp} = coefficients[j];
      y += amp * Math.sin(coefficients[j].freq * t + phase);
      x += amp * Math.cos(coefficients[j].freq * t + phase);
    }

    t += dt;
    yValues.push(y)
    xValues.push(x)
  }
}

function dft(sample) {
  let N = sample.length;
  let result = [];
  for (let k = 0; k < N; ++k) {
    let sum = [0, 0]

    for (let n = 0; n < N; ++n) {
      let angle = (TWO_PI * k * n) / N;
      sum[0] += sample[n] * cos(angle);
      sum[1] -= sample[n] * sin(angle);
    }
    sum[0] /= N;
    sum[1] /= N;

    result[k] = {
      point: sum,
      freq: k,
      phase: atan2(sum[1], sum[0]),
      amp: sqrt(sum[1] * sum[1] + sum[0] * sum[0])
    }
  }

  return result;
}

function secretFunction(x) {
  return x * sin(x*3) + x;
}

function draw() {
  background(220);
  let minY = -4;
  let maxY = 4;
  stroke(0);
  drawFunction(secretFunction, minX, maxX, minY, maxY, 100, 100, 300, 150);
  text('Original function', 20, 150)
  noFill();


  beginShape()
  stroke(33, 56, 169)
  maxValue = -Infinity;
  xValues.forEach((y, idx) => {
    let p = transform(
      minX + (maxX - minX) * idx / xValues.length,
      //y,
      xValues[idx],
      // yValues[idx],
      minY, maxY, 100, 100, 300, 150);
    let pixelY = p[1] + 100;
    vertex(p[0], pixelY);
    if (pixelY > maxValue) maxValue = pixelY;
  });
  text('Real part', 20, maxValue)
  endShape();
  
  beginShape()
  stroke(169, 56, 33)
  
  maxValue = -Infinity;
  yValues.forEach((y, idx) => {
    let p = transform(
      minX + (maxX - minX) * idx / yValues.length,
      yValues[idx],
      minY, maxY, 100, 100, 300, 150);
    let pixelY = p[1] + 200;
    vertex(p[0], pixelY);
    if (pixelY > maxValue) maxValue = pixelY;
  });
  text('Imaginary part', 20, maxValue)
  endShape();
  noLoop();
  // drawFunction(x => {
  //   let sum = 0;
  //   let time = (x - minX) / (maxX - minX);
  //   for (let i = 0; i < coefficients.length; ++i) {
  //     let c = coefficients[i];
  //     let phase = atan2(c[1], c[0])
  //     let amp = sqrt(c[1] * c[1] + c[0] * c[0]);
  //     sum += Math.sin(phase + time * 2 * Math.PI * c.freq  / coefficients.length) * amp;
  //   }
  //   return sum // coefficients.length;
  // }, minX, maxX, minY, maxY, 100, 60, 300, 120)
  // for (let i = 0; i < coefficients.length; ++i) {
  //   drawFunction(x => {
  //     return Math.sin(x*2 * Math.PI * i/coefficients.length) * coefficients[i][1]
  //   }, minX, maxX, minY, maxY, 100, 60 + i * 50, 300, 120 + i * 50)
  // }
}

function drawFunction(f, minX, maxX, minY, maxY, left, top, right, bottom) {
  let samples = 100;
  let dt = (maxX - minX) / samples;

  //   let maxY = -Infinity, minY = Infinity;
  //   for (let x = minX; x < maxX; x += dt) {
  //     let y = f(x);
  //     if (y < minY) minY = y;
  //     if (y > maxY) maxY = y;
  //   }

  let prev;
  for (let i = 0; i < samples; ++i) {
    let x = minX + dt * i;
    let scenePoint = transform(x, f(x), minY, maxY, left, top, right, bottom);
    if (i === 0) prev = scenePoint;
    else line(prev[0], prev[1], scenePoint[0], scenePoint[1]);
    prev = scenePoint;
  }

}

function transform(x, y, minY, maxY, left, top, right, bottom) {
  let x0 = (x - minX) / (maxX - minX);
  let y0 = (y - minY) / (maxY - minY);
  x0 = (right - left) * x0 + left;
  y0 = (bottom - top) * (1 - y0) + top;
  return [x0, y0]
}
