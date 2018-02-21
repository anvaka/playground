var createGraph = require('ngraph.graph');
var npath = require('ngraph.path');
var CELL_WIDTH = 1;

const getBBoxAndRects = require('./getBBoxAndRects');

module.exports = fieldRoads;

function fieldRoads(graph, layout) {
  let {bbox} = getBBoxAndRects(graph, layout);
  var width = bbox.width;
  var height = bbox.height;
  var largestCost = Number.NEGATIVE_INFINITY;
  var gridGraph = makeGridGraph(layout);
  var pathMemory = createPathMemory();

  var pathFinder = npath.aStar(gridGraph, {
    distance(fromNode, toNode, link) {
      var seenCount = pathMemory.getSeenCount(fromNode, toNode);
      var lengthReducer = seenCount === 0 ? 1 : (Math.exp(-0.8 * seenCount + Math.log(1 - 0.5)) + 0.5)
      var fromPos = fromNode.data;
      var toPos = toNode.data;
      var dist = npath.aStar.l2(fromPos, toPos)
      return link.data.cost * dist * lengthReducer;
    },
    heuristic(from, to) {
      // let fromPos = from.data;
      // let toPos = to.data;
      //var r = largestCost * gridGraph.getLinksCount();
      return 0; //npath.aStar.l2(fromPos, toPos) * Math.exp(-0.001 * r * r) ;
    }
  });

  var edges = routeEdges(layout, graph);
  return edges;

  function routeEdges(layout, graph) {
    var linksCount = graph.getLinksCount();
    var processed = 0;
    graph.forEachLink(link => {
      console.log('Processing ' + processed + ' out of ' + linksCount);
      processed += 1;
      var fromPos = layout.getNodePosition(link.fromId);
      var toPos = layout.getNodePosition(link.toId);
      var gridFrom = getGridNode(fromPos);
      var gridTo = getGridNode(toPos);

      let npath = pathFinder.find(gridFrom, gridTo);
      pathMemory.rememberPath(npath, link.fromId, link.toId);
    });

    return saveRoutes();
  }

  function getGridNode(pos) {
    var xr = (pos.x - bbox.left)/width;
    var yr = (pos.y - bbox.top)/height;

    var xCellCount = width/CELL_WIDTH;
    var yCellCount = height/CELL_WIDTH;

    var col = Math.floor(xCellCount * xr);
    var row = Math.floor(yCellCount * yr);

    return getGridNodeKey(col, row);
  }

  function saveRoutes() {
    var edges = []

    pathMemory.forEachEdge((v, k) => {
      var edgeParts = k.split(';');
      var fromParts = edgeParts[0].split(',').map(v => parseInt(v, 10));
      var toParts = edgeParts[1].split(',').map(v => parseInt(v, 10));
      var lineWidth = Math.round(Math.pow(Math.round(2 * v/pathMemory.getMaxSeen()), 1.4)) + 1;
      edges.push({ 
        from: {
          x: fromParts[0] + bbox.left,
          y: fromParts[1] + bbox.top
        }, 
        to: {
          x: toParts[0] + bbox.left,
          y: toParts[1] + bbox.top
        },
        width: lineWidth
      });
    });

    return edges;
  }


  function makeGridGraph(layout) {
    var gridGraph = createGraph();

    var cellsX = width/CELL_WIDTH;
    var cellsY = height/CELL_WIDTH;

    var maxVx = Number.NEGATIVE_INFINITY;
    var maxVy = Number.NEGATIVE_INFINITY;
    var minVx = Number.POSITIVE_INFINITY;
    var minVy = Number.POSITIVE_INFINITY;
    var maxV = 0;
    for (var col = 0; col < cellsX; col += 1) {
      for (var row = 0; row < cellsY; row += 1) {
        var x = (col * CELL_WIDTH + bbox.left);
        var y = (row * CELL_WIDTH + bbox.top);

        var v = getVelocity(x, y, layout);
        if (minVx > v.x) minVx = v.x; if (maxVx < v.x) maxVx = v.x;
        if (minVy > v.y) minVy = v.y; if (maxVy < v.y) maxVy = v.y;

        var vLength = length(v.x, v.y);
        if (vLength > maxV) maxV = vLength;

        gridGraph.addNode(getGridNodeKey(col, row), {
          vx: (v.x),
          vy: (v.y),
          x: x,
          y: y
        });
      }
    }

    console.log('Max v: ', maxV);

    for (var col = 0; col < cellsX - 1; col += 1) {
      for (var row = 0; row < cellsY - 1; row += 1) {
        var from = (getGridNodeKey(col, row));
        connect(from, getGridNodeKey(col + 1, row));
        connect(from, getGridNodeKey(col, row + 1));
        // var diag = connect(from, getGridNodeKey(col + 1, row + 1));
      }
    }

    return gridGraph;

    function connect(from, to) {
      var fromNode = gridGraph.getNode(from).data;
      var toNode = gridGraph.getNode(to).data;

      var costX = (fromNode.vx + toNode.vx)/(maxV * 2);
      var costY = (fromNode.vy + toNode.vy)/(maxV * 2);

      var cost = Math.sqrt(costX * costX + costY*costY);

      if (cost > largestCost) largestCost = cost;
      return gridGraph.addLink(from, to, {cost});
    }
  }

  function length(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  
  function getVelocity(x, y, layout) {
    var v = getNearestNodeDistance(x, y, layout);
    return {x: v, y: v};
  }

  function getNearestNodeDistance(x, y, layout) {
    // TODO: tree?
    var minL = Number.POSITIVE_INFINITY;
    layout.forEachBody(body => {
      var distToBody = length(body.pos.x - x, body.pos.y - y);
      if (distToBody < minL) {
        minL = distToBody;
      }
    });

    return minL;
  }
}

function getGridNodeKey(col, row) {
  return `${col},${row}`;
}

function createPathMemory() {
  var seenCount = new Map();
  var maxSeenValue = 0;

  return {
    rememberPath,
    getSeenCount,
    forEachEdge,
    getMaxSeen() {
      return maxSeenValue;
    }
  }

  function forEachEdge(cb) {
    seenCount.forEach(cb);
  }

  function rememberPath(path) {
    var from = path[0];
    for (var i = 1; i < path.length; ++i) {
      var to = path[i];
      rememberEdge(from, to);
      from = to;
    }
  }

  function getSeenCount(from, to) {
    var key = getEdgeKey(from, to);
    return seenCount.get(key) || 0;
  }

  function rememberEdge(from, to) {
    var key = getEdgeKey(from, to);
    var seenValue = (seenCount.get(key) || 0) + 1;
    if (seenValue > maxSeenValue) maxSeenValue = seenValue;
    seenCount.set(key, seenValue);
  }

  function getEdgeKey(from, to) {
    return from.id < to.id ? from.id + ';' + to.id : to.id + ';' + from.id;
  }
}