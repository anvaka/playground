module.exports = createGridLayoutViewModel;

var bus = require('../../lib/bus');
var gridRoads = require('./gridRoads');
var forEachRectangleNode = require('./forEachRectangle');
var getGridLines = require('./getGridLines');
var getBBoxAndRects = require('./getBBoxAndRects');
var getTesselationLines = require('./getTesselationLines');
var makeNoise = require('../../lib/geom/makeNoise');
var BBox = require('../../lib/geom/BBox');

let postRoadsTransform =  false;

function createGridLayoutViewModel(appModel) {
  var api = {
    moveToPosition,
    pullNodes,
    drawRoads,
    drawGrid,
    drawTesselation
  };

  return api;

  function drawTesselation(visible) {
    let { selectedCluster } = appModel;
    let linesId = 'tessel-grid' + selectedCluster.id;

    if (!visible) {
      bus.fire('draw-lines', null, { key: linesId });
      return;
    }

    let graph = selectedCluster.graph;
    let layout = selectedCluster.layout;
    let offset = selectedCluster.getOwnOffset();
    let lines = getTesselationLines(graph, layout, offset);

    bus.fire('draw-lines', lines, { key: linesId, color: {
      r: 0.3, g: 0.6, b: 0.9, a: 0.3
    } });
  }

  function drawGrid(visible) {
    let { selectedCluster } = appModel;
    let linesId = 'grid-grid' + selectedCluster.id;
    if (!visible) {
      bus.fire('draw-lines', null, { key:  linesId });
      return;
    }
    let graph = selectedCluster.graph;
    let layout = selectedCluster.layout;
    let offset = selectedCluster.getOwnOffset();
    let {bbox} = getBBoxAndRects(graph, layout);
    let lines = getGridLines(offset, bbox, 10);
    // let splitLine = displace(lines, bbox, offset);

    bus.fire('draw-lines', lines, {
      key: linesId,
      color: {r: 0.3, g: 0.3, b: 0.6, a: 0.3},
      sendToBack: true
    });
    // bus.fire('draw-lines', splitLine, {
    //   key: 'noise',
    //   color: {r: 0.0, g: 1.0, b: 0.6, a: 1.0}
    // });
  }

  function drawRoads() {
    let { selectedCluster } = appModel;
    let graph = selectedCluster.graph;
    let layout = selectedCluster.layout;
    let offset = selectedCluster.getOwnOffset();
    let lines = gridRoads(graph, layout);

    if (postRoadsTransform) {
      let splitLine = displace(lines, graph, layout);
      rotate(lines, graph, layout, Math.random() * 180);
      translateLines(lines, offset);
      // translateLines(splitLine, offset);
      // bus.fire('draw-lines', splitLine, {
      //   key: 'noise',
      //   color: {r: 0.0, g: 1.0, b: 0.6, a: 1.0}
      // });
    }
    bus.fire('draw-lines', lines, {
      key: 'grid-roads' + selectedCluster.id,
      sendToBack: true,
      color: {
        r: 255/255,
        g: 255/255, 
        b: 255/255,
        a: 0.4 
      }
    });

  }

  function translateLines(lines, offset) {
    lines.forEach(l => {
      l.from.x += offset.x;
      l.from.y += offset.y;
      l.to.x += offset.x;
      l.to.y += offset.y;
    })
  }

   function moveToPosition() {
     let { selectedCluster } = appModel;
     let graph = selectedCluster.graph;
     let layout = selectedCluster.layout;

     let seenPos = new Set();
     let cellSize = 20;

     graph.forEachNode(node => {
       let pos = layout.getNodePosition(node.id);
       let nodeSize = (node.data.size || cellSize) / 2;
       let x = cellSize * Math.round((pos.x - nodeSize) / cellSize);
       let y = cellSize * Math.round((pos.y - nodeSize) / cellSize);
       let key = x + ';' + y;
       let t = 1;
       while (seenPos.has(key)) {
         let sx = Math.random() < 0.5 ? 1 : -1;
         let sy = Math.random() < 0.5 ? 1 : -1;
         x = cellSize * (Math.round((pos.x - nodeSize) / cellSize) + sx * t);
         y = cellSize * (Math.round((pos.y - nodeSize) / cellSize) + sy * t);
         key = x + ';' + y;
         t += 1;
       }

       seenPos.add(key);
       pos.x = x + nodeSize;
       pos.y = y + nodeSize;
       // layout.setNodePosition(node.id, 20 * Math.round(pos.x / 20), 20 * Math.round(pos.y / 20));
     })
   }

   function pullNodes() {
     let { selectedCluster } = appModel;
     let {layout, graph} = selectedCluster;

     let points = [];
     forEachRectangleNode(graph, layout, rect => points.push(rect));

     pullnodes(points);

     points.forEach(p => {
       if (Number.isNaN(p.cx) || Number.isNaN(p.cy)) {
         throw new Error('nan');
       }
       layout.setNodePosition(p.id, p.cx, p.cy);
     })
   }
}

function pullnodes(points) {
  for(var i = 0; i < points.length; ++i) {
    let p = points[i];
    let nearest = findNearestPoint(p, points, 100)
    if (nearest) pullTogether(p, nearest);
  }
}

function findNearestPoint(src, points) {
  // this is not optimal, just testing;
  let minRect;
  let minOverlap = Number.POSITIVE_INFINITY;

  points.forEach(p => {
    if (p === src) return;
    let dx = p.cx - src.cx;
    let dy = p.cy - src.cy;
    let t = Math.abs(dx) + Math.abs(dy);
    if (t < minOverlap) {
      minOverlap = t;
      minRect = p;
    } 
  });

  return minRect
  
}

function pullTogether(a, b) {
  let t = getOverlapFactor(a, b);
  let dx = (a.cx - b.cx);
  let dy = (a.cy - b.cy);

  a.cx = b.cx + t * dx;
  a.cy = b.cy + t * dy;
}

function getOverlapFactor (a, b) {
  const dx = Math.abs(a.cx - b.cx)
  const dy = Math.abs(a.cy - b.cy)

  const wx = (a.width + b.width) / 2
  const wy = (a.height + b.height) / 2

  const t = Math.min(wx / dx, wy / dy)
  return t
}

function rotate(lines, graph, layout, angle) {
  let alpha = angle * Math.PI  / 180;

  graph.forEachNode(n => {
    let pos = layout.getNodePosition(n.id);
    rotatePoint(pos, alpha);
  });

  lines.forEach(l => {
    rotatePoint(l.from, alpha);
    rotatePoint(l.to, alpha);
  });
}

function rotatePoint(pos, alpha) {
  let x = pos.x * Math.cos(alpha) - pos.y * Math.sin(alpha);
  let y = pos.y * Math.cos(alpha) + pos.x * Math.sin(alpha);
  pos.x = x;
  pos.y = y;
}

function displace(lines, graph, layout) {
  let bbox = new BBox();
  lines.forEach(l => {
    bbox.addPoint(l.from.x, l.from.y);
    bbox.addPoint(l.to.x, l.to.y);
  })
  const variance = bbox.width * 0.2;
  const noise = []
  const transform = naiveT;  // transformPoint
  makeNoise(-bbox.width/2, bbox.cy, bbox.width/2, bbox.cy, variance, 4, noise)
  lines.forEach(l => {
    let newFrom = transform(l.from, noise);
    let newTo = transform(l.to, noise);

    l.from = newFrom;
    l.to = newTo;
  })

  if (graph) {
    graph.forEachNode(n => {
      let pos = layout.getNodePosition(n.id);
      let newPos = transform(pos, noise);
      pos.x = newPos.x;
      pos.y = newPos.y;
    });
  }

  // lines.forEach(l => {
  //   rotatePoint(l.from, alpha);
  //   rotatePoint(l.to, alpha);
  // });
 
  let splitLine = toLine(noise);
  return splitLine;
}

function toLine(polyLine) {
  let splitLine = [];
  var from = {
    x: polyLine[0].x,
    y: polyLine[0].y
  }
  for (var i = 1; i < polyLine.length; ++i) {
    var to = {
      x: polyLine[i].x,
      y: polyLine[i].y
    };
    splitLine.push({
      from,
      to
    });
    from = to;
  }
  return splitLine
}

function transformPoint(point, tPoints) {
  let index = findNearestIndex(tPoints, point.x);
  let t = tPoints[index];
  let t1;
  if (index < tPoints.length - 1) {
    t1 = tPoints[index + 1]
  } else {
    t1 = tPoints[index];
    t = tPoints[index - 1];
  }
  let angle = getAngle(t, t1)
//   if (index > 0) {
//     let prevAngle = getAngle(tpoints[index - 1], t);
//     angle = (angle + prevAngle)/2;
//   }
//  let intensity = 1 - clamp(Math.abs(point.y/100), 0, 1);
  
  let x1 = -point.y * Math.sin(angle);
  let y1 = point.y * Math.cos(angle);
  
  return {
    x: x1 + point.x,
    y: y1 + t.y
  }
}

function clamp(v, min, max) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

// function lerp(v0, v1, t) {
//   return (1 - t) * v0 + t * v1;
// }

function findNearestIndex(array, x) {
  if (array.length === 0) return -1;
  
  var left = 0;
  var right = array.length - 1;
  
  if (x < array[left].x) return 0;
  if (x > array[right].x) return right;
  
  var midPoint;
  while(left <= right) {
    midPoint = Math.floor((left + right) / 2);
    var v = array[midPoint];
    if (x < v.x) right = midPoint - 1;
    else if (x > v.x) left = midPoint + 1;
    else return midPoint;
  }
  
  // left == right + 1
  return (array[left].x - x < x - array[right].x) ? left : right;
}

function getAngle(a, b) {
  let dx = b.x - a.x;
  let dy = b.y - a.y;
  return Math.atan2(dy, dx);
}

function naiveT(point, tPoints) {
  let index = findNearestIndex(tPoints, point.x);
  let t = tPoints[index];
  let coeff = 1 - clamp(Math.abs(point.y), 0, 100) / 100;

  return {
      x: point.x,
      y: point.y + t.y * coeff
    }
}
