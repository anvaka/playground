module.exports = createGridLayoutViewModel;

var bus = require('../../lib/bus');
var gridRoads = require('./gridRoads');
var forEachRectangleNode = require('./forEachRectangle');
var getGridLines = require('./getGridLines');
var getBBoxAndRects = require('./getBBoxAndRects');

function createGridLayoutViewModel(appModel) {
  var api = {
    moveToPosition,
    pullNodes,
    drawRoads,
    drawGrid
  };

  return api;

  function drawGrid(visible) {
    let { selectedCluster } = appModel;

    if (!visible) {
      bus.fire('draw-lines', null, {
        key: 'grid-grid' + selectedCluster.id
      });
      return;
    }
    let graph = selectedCluster.graph;
    let layout = selectedCluster.layout;
    let offset = selectedCluster.getOwnOffset();
    let {bbox} = getBBoxAndRects(graph, layout);
    let lines = getGridLines(offset, bbox, 10);

    bus.fire('draw-lines', lines, {
      key: 'grid-grid' + selectedCluster.id
    });
  }

  function drawRoads() {
    let { selectedCluster } = appModel;
    let graph = selectedCluster.graph;
    let layout = selectedCluster.layout;
    let offset = selectedCluster.getOwnOffset();
    let lines = gridRoads(graph, layout, offset);

    bus.fire('draw-lines', lines, {
      key: 'grid-roads' + selectedCluster.id,
      // sendToBack: true
    });
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