import createGraph from 'ngraph.graph';
import createLayout from 'ngraph.forcelayout';
import bus from '../../lib/bus';
import fieldRoads from './fieldRoads';
import forEachRectangleNode from './forEachRectangle';
import getGridLines from './getGridLines';
import getBBoxAndRects from './getBBoxAndRects';
import getTesselationLines from './getTesselationLines';
import findCircleIntersection from './findCircleIntersection';
import uniteLines from './uniteLines';

export default function createGridLayoutViewModel(appModel) {
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
  }

  function drawRoads() {
    let useGrid = true;
    moveToPosition();
    let { selectedCluster } = appModel;
    let graph = selectedCluster.graph;
    let layout = selectedCluster.layout;
    let offset = selectedCluster.getOwnOffset();
    // TODO: need to augment graph with outgoing edges, so that highways are rendered correctly
    var clusterRect = layout.getGraphRect();
    var r = Math.max(clusterRect.x2 - clusterRect.x1, clusterRect.y2 - clusterRect.y1)/2;

    let globalPositions = appModel.root.buildNodePositions();
    let rootGraph = appModel.rootGraph;
    var helpLines = [];
    // augmented graph includes nodes that are on the boundary between clusters
    var augmentedGraph = createGraph();
    var segmentsCount = 6;
    graph.forEachNode(node => {
      augmentedGraph.addNode(node.id, node.data);
      var ourPos = globalPositions.get(node.id);

      // traverse connections in the top level graph
      rootGraph.forEachLinkedNode(node.id, other => {
        if (graph.getNode(other.id)) return; // this connection is in-cluster - no need to process it.
        var otherPos = globalPositions.get(other.id);
        // find where the other pos intersects our own circle
        var circleIntersection = findCircleIntersection(offset.x, offset.y, r, ourPos.x, ourPos.y, otherPos.x, otherPos.y);
        if (!circleIntersection) {
          console.error('Cluster circle is not intersected. How so?');
          return;
        }
        var rx = circleIntersection.x - offset.x;
        var ry = circleIntersection.y - offset.y;
        var angle = Math.atan2(ry, rx);
        if (angle < 0) angle = Math.PI * 2 + angle;
        var bucket = Math.round(segmentsCount * angle/(2 * Math.PI));
        var bucketNodeId = '!!bucket_' + bucket;
        var bucketNode = augmentedGraph.getNode(bucketNodeId);
        if (!bucketNode) {
          bucketNode = augmentedGraph.addNode(bucketNodeId, {size: 1});
          bucketNode.data.isBucket = true;
          bucketNode.data.pos = {
            x: r * Math.cos(bucket*(Math.PI * 2)/segmentsCount),
            y: r * Math.sin(bucket*(Math.PI * 2)/segmentsCount)
          }
          helpLines.push({
            from: {
              x: offset.x,
              y: offset.y
            }, 
            to: {
              x: bucketNode.data.pos.x + offset.x,
              y: bucketNode.data.pos.y + offset.y
            }
          })
        }
        augmentedGraph.addLink(node.id, bucketNodeId);
      })
    });
    // bus.fire('draw-lines', helpLines, {
    //   key: 'help-lines',
    //   color: {r: 0.3, g: 0.3, b: 0.6, a: 0.3},
    //   sendToBack: true
    // });

    graph.forEachLink(link => {
      augmentedGraph.addLink(link.fromId, link.toId, link.data);
    });
    var settings = Object.assign({}, layout.simulator.settings);
    delete settings.nodeMass;
    // we just copy the layout, we will not run it - needed to set augmented node positions
    var augmentedLayout = createLayout(augmentedGraph, settings)
    augmentedGraph.forEachNode(node => {
      var p;
      if (node.data.isBucket) {
        p = node.data.pos;
      } else {
        p = layout.getNodePosition(node.id);
      }
      augmentedLayout.setNodePosition(node.id, p.x, p.y);
    })

    let roadLayout = fieldRoads(augmentedGraph, augmentedLayout, useGrid);

    var lines = roadLayout.lines.filter(smallLength);
    uniteLines(lines);

    translateLines(lines, offset);
    var nodes = roadLayout.nodes;
    nodes.forEach(node => {
      var pos = node; // comes from fieldRoads.
      var originalNode = graph.getNode(node.id);
      if (originalNode) {
        layout.setNodePosition(node.id, pos.x, pos.y);
        pos.size = originalNode.data.size;
      }
    });

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

  function smallLength(line) {
    let lineLength = length(line.from, line.to);
    return (lineLength >= line.width * 1.4);
  }

   function moveToPosition() {
     let { selectedCluster } = appModel;
     let graph = selectedCluster.graph;
     let layout = selectedCluster.layout;

     let seenPos = new Set();
     // TODO: Need to consolidate these constants.
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
      //  pos.x = x + nodeSize;
      //  pos.y = y + nodeSize;
       layout.setNodePosition(node.id, x + nodeSize, y + nodeSize)
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

function saveSvg(nodes, lines, graph) {
var svg = [`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"> 
<style>
    /* <![CDATA[ */
    path {
      stroke: #67B1F1;
    }
    /* ]]> */
  </style>
  <g id="scene">`];


  var prefix = '  ';

  svg.push(prefix + '<g id="lines">')
  prefix = '    ';
  lines.forEach(line => {
    svg.push(`${prefix}<path d="M${line.from.x} ${line.from.y} L${line.to.x} ${line.to.y}" stroke-width="${line.width}" fill="transparent"></path>`);
  })
  svg.push(prefix + '</g>') // lines

  prefix = '  ';
  svg.push(prefix + '<g id="nodes">')
  prefix = '    ';
  nodes.forEach(node => {
    let attr = graph.getNode(node.id).data;
    if (attr && attr.product) {
      var img = attr.product.icon; // image
      var maxW = (30 * node.size/20 + 6) * 0.6;
      var scale = maxW/img.Width
      var height = img.Height * scale;
      var x = node.x - maxW/2;
      var y = node.y - height/2;
      svg.push(`
<a target="_blank" id="${node.id}" xlink:href="${attr.product.url.replace(/&/g, '&#38;')}" transform="translate(${x}, ${y})">
  <image width="${maxW}" height="${height}" xlink:href="${img.URL}"></image>
</a>`);
    } else {
      svg.push(`${prefix}<circle cx="${node.x}" cy="${node.y}" r="${node.size || 2}"></circle>`)
    }
  })
  svg.push(prefix + '</g>') // nodes
  
  svg.push("</g>");
  svg.push('</svg>');
  return svg.join('\n');
}

function length(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}