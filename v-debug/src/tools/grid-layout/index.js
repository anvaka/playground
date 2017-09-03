module.exports = createGridLayout;

const Rect = require('../../lib/Rect');

var bus = require('../../lib/bus');
var GridLayoutSettings = require('./GridLayoutSettings.vue');

function createGridLayout(appModel) {
  return {
    id: 'grid-layout@v0',
    component: GridLayoutSettings, 
    vm: createGridLayoutViewModel(appModel)
  };
}

function createGridLayoutViewModel(appModel) {
   var api = {
     moveToPosition,
     pullNodes,
     drawRoads
   };

   return api;

   function drawRoads() {
     let { selectedCluster } = appModel;
     let graph = selectedCluster.graph;
     let layout = selectedCluster.layout;

     let lines = [];
     let offset = selectedCluster.getOwnOffset();
     graph.forEachLink(l => {
       let from = layout.getNodePosition(l.fromId)
       let to = layout.getNodePosition(l.toId);
       let dx = 10;
       let dy = -10;
       if (from.x < to.x) {
         dx = -10;
       }
       if (from.y < to.y) {
         dy = 10;
       }
       lines.push({
         from: {
           x: offset.x + from.x,
           y: offset.y + from.y + dy
         }, 
         to: {
           x: offset.x + to.x + dx,
           y: offset.y + from.y + dy
         }
        }, {
          from: {
            x: offset.x + to.x + dx,
            y: offset.y + from.y + dy
          },
          to: {
            x: offset.x + to.x + dx,
            y: offset.y + to.y
           }
         } 
       )
     });
     bus.fire('draw-lines', lines, {
       key: 'grid-roads'
     });
   }

   function moveToPosition() {
     let { selectedCluster } = appModel;
     let graph = selectedCluster.graph;
     let layout = selectedCluster.layout;

     let seenPos = new Set();
     graph.forEachNode(node => {
       let pos = layout.getNodePosition(node.id);
       let x = 20 * Math.round(pos.x / 20);
       let y = 20 * Math.round(pos.y / 20);
       let key = x + ';' + y;
       let t = 1;
       while (seenPos.has(key)) {
         let sx = Math.random() < 0.5 ? 1 : -1;
         let sy = Math.random() < 0.5 ? 1 : -1;
         x = 20 *(Math.round(pos.x / 20) + sx * t);
         y = 20 * (Math.round(pos.y / 20) + sy * t);
         key = x + ';' + y;
         t += 1;
       }
       seenPos.add(key);
       pos.x = x;
       pos.y = y;
       // layout.setNodePosition(node.id, 20 * Math.round(pos.x / 20), 20 * Math.round(pos.y / 20));
     })
   }

   function pullNodes() {
     let { selectedCluster } = appModel;
     let graph = selectedCluster.graph;
     let layout = selectedCluster.layout;
     let points = [];

     graph.forEachNode(node => {
       let pos = layout.getNodePosition(node.id);
       let size = (node.data.size || 20)/2
       points.push(new Rect({
         id: node.id,
         left: pos.x - size,
         top: pos.y - size,
         width: 2 * size,
         height: 2 * size,
       }));
       // layout.setNodePosition(node.id, 20 * Math.round(pos.x / 20), 20 * Math.round(pos.y / 20));
     });

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