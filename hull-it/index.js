let concaveman = require('concaveman');
let Delaunator = require('delaunator');
let nodes = require('./data/100nodes_take2.json');
let rnd = require('ngraph.random')(44);
var inside = require('point-in-polygon');


let points = [];
nodes.forEach(e => {
  points.push([Number.parseFloat(e.x), Number.parseFloat(e.y)]);
});

let polygon = concaveman(points);

let delaunay = Delaunator.from(points);

let start = delaunay.hull;
let hull = [];
let current = start;

// get arithmetic mean of a center of a hull:
let ax = 0, ay = 0;
let count = 0;
do {
  // hull.push([current.x, current.y]);
  ax += current.x;
  ay += current.y;
  current = current.next;
  count += 1;
} while(current !== start);
ax /= count;
ay /= count;


// Build hull at slightly larger scale
current = start;
do {
  var nx = current.x - ax;
  var ny = current.y - ay;
  hull.push([ax + nx, ay + ny]);
  current = current.next;
} while(current !== start);

// Now make brownian bridge:
let coastline = []
for (var i = 1; i < hull.length; ++i) {
  coastline.push(getCoastSide(hull[i - 1], hull[i]))
}
coastline.push(getCoastSide(hull[hull.length - 1], hull[0]));
var all = [];
coastline.forEach(c => c.forEach(el => all.push(el)));
all = concaveman(all);
// let coordinates = [];
// let triangles = delaunay.triangles;

// for (let i = 0; i < triangles.length; i += 3) {
//     coordinates.push([
//         points[triangles[i]],
//         points[triangles[i + 1]],
//         points[triangles[i + 2]]
//     ]);
// }

function getCoastSide(from, to) {
  var result = [];
  var step = 6;

  var dx = (to[0] - from[0]);
  var dy = (to[1] - from[1]);
  var l = Math.sqrt(dx * dx + dy * dy);
  var variance = l * 10;
  var speed = 2.8;

  runInternal(from, to, step, variance)

  return result;

  function runInternal(from, to, step, variance) {
    var dx = to[0] - from[0];
    var dy = to[1] - from[1];
    var l = Math.sqrt(dx * dx + dy * dy);
    if (l === 0) {
      return [];
    }

    var nx = dx/l;
    var ny = dy/l;

    var mx = (to[0] + from[0])/2;
    var my = (to[1] + from[1])/2;
    var newTo;

    do {
      var offsetX = rnd.gaussian() * Math.sqrt(variance);
      var candidateX = mx + ny * offsetX;
      var candidateY = my - nx * offsetX;

      // var changeSize = Math.sign(cross([dx, dy], [ax - from[0], ay - from[1]])) !== Math.sign(cross([dx, dy], [ax - candidateX, ay - candidateY]));

      // if (changeSize) {
      //   //candidateY = my + nx * offsetX;
      // } 
      newTo = [candidateX, candidateY];
    } while (inside(newTo, polygon))

    if (step === 0) {
      result.push(from, newTo);
    } else {
      runInternal(from, newTo, step - 1, variance / speed);
      runInternal(newTo, to, step - 1, variance / speed);
    }
  }
}

printSvg(points);

function cross(a, b) {
  return a[0] * b[1]  - a[1] * b[0];
}

function printSvg(points) {
  var svg = [`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<style>
    /* <![CDATA[ */
    circle {
      fill: orangered;
    }
    /* ]]> */
  </style>
  <g id="scene">`];

  //coordinates.forEach(c => printPath(c, svg, 'blue'));
// coastline.forEach(c => printPath(c, svg, 'blue'));
  // printPath(hull, svg, 'red');
  printPath(all, svg, {
    fill: 'deepskyblue'
  });
  printPoints(points, svg);

  svg.push('</g></svg>')
  console.log(svg.join('\n'));
}

function printPoints(points, svg) {
  points.forEach(p => {
    svg.push(circle(p[0], p[1]));
  });
}

function printPath(poly, svg, colors) {
  let pt = poly[0];
  let path = ['M' + pt[0] + ',' + pt[1] + ' L'];

  for(let i = 1; i < poly.length; ++i) {
    pt = poly[i];
    path.push(pt[0] + ',' + pt[1] + ' ');
  }
  path.push('Z');
  svg.push(`<path d='${path.join('')}' stroke='${colors.stroke || "transparent"}' stroke-width='1' fill='${colors.fill || "transparent"}'></path>`)
}

function circle(x, y) {
  return `<circle cx='${x}' cy='${y}' r='5'></circle>`
}