import Delaunator from './delaunator.js'
import getPoints from './points.js'

const colors = ["#e45287", "#4a1949", "#84207a", "#9cbab3", "#3e2374", "#6e77a3", "#3e7c8c", "#459b98", "#396b87", "#6e599e", "#503d90", "#4b6e94", "#5b4e97", "#3a4381", "#565d96", "#484e8e"];

let sivg = window.sivg;
let points =  getPoints().slice(10, 15);
let delaunay = Delaunator.from(points, p => p.x, p => p.y);

var element = document.getElementById('scene')
panzoom(element)


let {triangles} = delaunay;
for (let i = 0; i < triangles.length; i += 3) {
  let p = [points[triangles[i + 0]], points[triangles[i + 1]], points[triangles[i + 2]]];

  let triangle = sivg('path', {
    d: p.map((p, index) => {
      let prefix = index === 0 ? 'M' : 'L';
      return `${prefix}${p.x},${p.y}`;
    }).join('') + 'z',
    fill: 'transparent',
    stroke: 'rgba(0, 0, 0, 0.3)',
    'stroke-width': 0.1
  });
  element.appendChild(triangle);
}

points.forEach((point, index) => {
  let rect = sivg('rect', {
    x: point.x - 1,
    y: point.y - 1,
    width: 2,
    height: 2,
    stroke: getColor(index),
    fill: getColor(index),
    'stroke-width': 0.4
  });
  element.appendChild(rect);
});

function getColor(index) {
  return colors[index % colors.length];
}


const circumcenters = [];
for (let i = 0; i < triangles.length; i += 3) {
  const t1 = triangles[i];
  const t2 = triangles[i + 1];
  const t3 = triangles[i + 2];

  const x1 = points[t1].x;
  const y1 = points[t1].y;
  const x2 = points[t2].x;
  const y2 = points[t2].y;
  const x3 = points[t3].x;
  const y3 = points[t3].y;

  let minX = Math.min(x1, x2, x3);
  let minY = Math.min(y1, y2, y3);
  let maxX = Math.max(x1, x2, x3);
  let maxY = Math.max(y1, y2, y3);
  let w = maxX - minX;
  let h = maxY - minY;
  let s = Math.max(w, h);

  circumcenters.push({x: minX + s / 2, y: minY + s / 2});

  let goDown = 1;//minY + s === maxY;
  let circumCircle = sivg('rect', {
    x: minX,
    y: goDown ? minY : maxY - s,
    width: s,
    height: s,
    stroke: 'rgba(0, 0, 233, 0.8)',
    fill: 'transparent',
    'stroke-width': 0.2
  });
  element.appendChild(circumCircle)
}
/*
let halfedges = delaunay.halfedges;

for (let i = 0; i < halfedges.length; ++i) {
  const j = halfedges[i];
  if (j < i) continue;

  const ti = Math.floor(i / 3);
  const tj = Math.floor(j / 3);
  const {x: x1, y: y1} = circumcenters[ti];
  const {x: x2, y: y2} = circumcenters[tj];
  let line = sivg('line', {
    x1,
    y1,
    x2,
    y2,
    stroke: 'rgba(0, 0, 233, 0.8)',
    'stroke-width': 0.2
  });
  element.appendChild(line)
}
*/