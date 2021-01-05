// a quick voronoi sketch
// https://editor.p5js.org/anvaka/sketches/qcdQEPCYr
let DRAW_IMAGE = 1;
let DRAW_IMAGE_POINTS = 2;
let OBSERVE = 3;
let state = DRAW_IMAGE;

let points = [];
let pixels = [];
let pixelSampleSize = 10;
let voronoi;
let transitionDuration = 120;
let frameNumber = 0;
let direction = 1;

function setup() {
  createCanvas(664, 822);
  background(220);
  img = loadImage('./voroni.jpg');
}

function draw() {
  if (state === DRAW_IMAGE) image(img, 0, 0);
  else if (state === DRAW_IMAGE_POINTS) {
    background(220);
    let t = frameNumber / transitionDuration;
    if (direction < 0) t = 1 - t;
    
    tint(255, 255 * (1 - t));
    image(img, 0, 0);
    points.forEach((point, index) => {
      let color = point.color;
      drawingContext.beginPath();
      drawingContext.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]}, ${t})`;
      voronoi.renderCell(index, drawingContext);
      drawingContext.fill();
    })
    frameNumber += 1;
    if (frameNumber >= transitionDuration) {
      state = OBSERVE
      frameNumber = 0;
    }
  } else if (state === OBSERVE) {
    frameNumber += 1;
    if (frameNumber > transitionDuration) {
      direction *= -1;
      state = DRAW_IMAGE_POINTS;
      frameNumber = 0;
    }
  }
}

function mouseClicked() {
  if (state === DRAW_IMAGE_POINTS) return;
  if (state === OBSERVE) {
    state = DRAW_IMAGE;
    return;
  }

  state = DRAW_IMAGE_POINTS;
  img.loadPixels();
  let colCount = Math.floor(img.width / pixelSampleSize);
  let rowCount = Math.floor(img.height / pixelSampleSize);

  for (let row = 0; row < rowCount; ++row) {
    let currentCol = [];
    pixels[row] = currentCol;
    for (let col = 0; col < colCount; ++col) {
      currentCol[col] = sampleImage(row, col);
      let intensity = getColorIntensity(currentCol[col]);
      if (50 < intensity && intensity < 150) {
        points.push({
          pos: [
            (col + 0.5) * pixelSampleSize,
            (row + 0.5) * pixelSampleSize
          ],
          color: currentCol[col]
        })
      }
    }
  }

  const delaunay = d3.Delaunay.from(points.map(x => x.pos));
  voronoi = delaunay.voronoi([0, 0, img.width, img.height]);
  frameNumber = 0;
}

function sampleImage(row, col) {
  let colorSum = [0, 0, 0];
  let dx = col * pixelSampleSize;
  let dy = row * pixelSampleSize;
  let count = 0;

  for (let x = 0; x < pixelSampleSize; ++x) {
    for (let y = 0; y < pixelSampleSize; ++y) {
      let color = getColor(x + dx, y + dy);
      if (color < 0) continue;
      colorSum[0] += color[0];
      colorSum[1] += color[1];
      colorSum[2] += color[2];
      count += 1;
    }
  }
  if (count > 0) {
    return colorSum.map(x => Math.round(x / count));
  }
  return -1;
}

function getColor(x, y) {
  if (x < 0 || x >= img.width) return -1;
  if (y < 0 || y >= img.height) return -1;
  let index = (x + y * img.width) * 4;

  return [img.pixels[index], img.pixels[index + 1], img.pixels[index + 2]];
}

function getColorIntensity(color) {
  return (color[0] + color[1] + color[2]) / 3;
}