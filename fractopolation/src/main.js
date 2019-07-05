import KDBush from 'kdbush';
import concaveman from 'concaveman';

class Complex {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  mul(other) {
    let x = this.x * other.x - this.y * other.y;
    let y = this.x * other.y + this.y * other.x;
    return new Complex(x, y);
  }

  add(other) {
    return new Complex(
      this.x + other.x,
      this.y + other.y
    );
  }

  abs() {
    let x = this.x * this.x;
    let y = this.y * this.y;
    return Math.sqrt(x + y);
  }

}
let minX = -1, maxX = 1;
let minY = -1, maxY = 1;
let points = collectPoints();
const index = new KDBush(points, p => p.x, p => p.y);
let counts = [];
points = points.filter(p => {
  let nSize = index.within(p.x, p.y, 0.02).length;
  return nSize > 20; //2739;
})

let poly = concaveman(points.map(p => [p.x, p.y])).map(pair => ({x: pair[0], y: pair[1]}));
let canvas = document.getElementById('canvas');

let ctx = canvas.getContext('2d');
let size = 400; // Math.min(window.innerWidth, window.innerHeight);
let width = ctx.width = canvas.width = size;
let height = ctx.height = canvas.height = size;

points.forEach(extendBounds);
let modelWidth = maxX - minX;
let modelHeight = maxY - minY;
let pointColor = 'black';
// points.forEach(drawPoint);
poly.forEach(drawPoint);
debugger;
window.all = poly.map(p => {
  var x = width * (p.x - minX) / modelWidth;
  var y = height * (p.y - minY) / modelHeight;
  return {x, y};
})

// pointColor = 'red';
// drawPoint({x: 0.02, y: 0.02});
// drawPoint({x: 0.02, y: -0.02});
// drawPoint({x: -0.02, y: -0.02});


function drawPoint(p) {
  var x = width * (p.x - minX) / modelWidth;
  var y = height * (p.y - minY) / modelHeight;

  ctx.fillStyle = pointColor;
  ctx.fillRect(x - 1, y - 1,2,2)
}

function extendBounds(p) {
  if (minX > p.x) minX = p.x;
  if (minY > p.y) minY = p.y;
  if (maxX < p.x) maxX = p.x;
  if (maxY < p.y) maxY = p.y;
}


function collectPoints() {
  let points = [];
  let sampleSize = 100;
  let dx = (maxX - minX) / sampleSize;
  let dy = (maxY - minY) / sampleSize;

  for (let x = minX; x < maxX; x += dx) {
    for (let y = minY; y < maxY; y += dy) {
      let p = new Complex(x, y);
      let z = new Complex(0, 0);
      let nextZ = z;
      for (var i = 0; i < 32; ++i) {
        if (nextZ.abs() > 2) {
          break;
        } else {
          points.push(z);
          z = nextZ;
        }
        nextZ = z.mul(z).add(p);
      }
    }

  }

  return points;
}