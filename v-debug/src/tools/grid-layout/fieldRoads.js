var createGraph = require('ngraph.graph');
var npath = require('ngraph.path');
var CELL_WIDTH = 1;

var simplifyPointsPath = require('./simplify');
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

    pathMemory.simplify();

    pathMemory.forEachEdge(v => {
      var from = v.fromId.split(',').map(v => Number.parseFloat(v));
      var to = v.toId.split(',').map(v => Number.parseFloat(v));
      var lineWidth = Math.round(Math.pow(Math.round(2 * v.data/pathMemory.getMaxSeen()), 1.4)) + 1;
      edges.push({ 
        from: {
          x: from[0] + bbox.left,
          y: from[1] + bbox.top
        }, 
        to: {
          x: to[0] + bbox.left,
          y: to[1] + bbox.top
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
  var roots = new Set(); // where the paths start and end.
  var maxSeenValue = 0;
  var pathGraph = createGraph();

  return {
    rememberPath,
    getSeenCount,
    simplify,
    forEachEdge,
    getMaxSeen() {
      return maxSeenValue;
    }
  }

  function forEachPathFrom(node, callback) {
    if (!node || !node.links) return;
    var visited = new Set();

    for(var i = 0; i < node.links.length; ++i) {
      var start = node.links[i];
      //if (start.fromId !== node.id) continue;
      var nextNodeId = start.fromId === node.id ? start.toId : start.fromId;

      var path = [];

      var parts = node.id.split(',').map(v => Number.parseFloat(v));
      visited.add(node.id)
      path.push({
        id: node.id,
        x: parts[0],
        y: parts[1],
        weight: start.weight
      });
      do {
        visited.add(nextNodeId);
        parts = nextNodeId.split(',').map(v => Number.parseFloat(v));
        path.push({
          id: nextNodeId,
          x: parts[0],
          y: parts[1],
          weight: start.data
        });

        var toNode = pathGraph.getNode(nextNodeId);
        var links = toNode.links;

        if (toNode.links.length !== 2) break; // No need to traverse further, as this is a crossroad.
        if (toNode.data && toNode.data.node) break; // We hit destination node. Cannot simplify further

        // Now we know we are in the middle of the road, there are no crossroads,
        // and we potentially can remove this node. But where should we go next?

        // We need to pick a link, that we haven't seen yet.
        // One of the link will be the link from where we came.
        if (links[0].fromId === start.fromId && links[0].toId === start.toId) {
          // So we should pick the link that we haven't seen yet.
          start = links[1];
        } else {
          start = links[0];
        }
        // we treat the graph as not oriented, so either toId or fromId should be our
        // target
        nextNodeId = start.fromId === nextNodeId ? start.toId : start.fromId;

        if (visited.has(nextNodeId)) {
          break; // Loop?
        } 
      } while (true);

      callback(path);
    }
  }

  function pointEqual(a, b) {
    return a.x === b.x && a.y === b.y;
  }

  function simplify() {
    console.log('Simplifying graph with ', pathGraph.getLinksCount() + ' edges, ' + pathGraph.getNodesCount() + ' nodes');
    var totalRemoved = 0;

    roots.forEach(nodeId => { 
      var node = pathGraph.getNode(nodeId);
      if (!node) throw new Error('Nodes should never be removed');
      forEachPathFrom(node, path => {
        if (path.length < 3) return;

        if (path[0].id === '132,102') debugger;
        // console.log('Path from ', node.id);
        // console.log('Actual:', path);
        var simplifiedPath = simplifyPointsPath(path, 3);
        // console.log('Simplified:', simplifiedPath)
        var prev = path[0];
        var removedWeight = 0;
        var removed = 0;
        var simplifiedPathIndex = 1; // start from 1 since 0 should be the same as start
        if (!pointEqual(simplifiedPath[0], path[0])) throw new Error('Your expectations are wrong');
        if (!pointEqual(simplifiedPath[simplifiedPath.length - 1], path[path.length - 1])) throw new Error('Your expectations are wrong');

        for (var pathIndex = 1; pathIndex < path.length; ++pathIndex) {
          var originalPoint = path[pathIndex];
          if (pointEqual(simplifiedPath[simplifiedPathIndex], originalPoint)) {
            if (removed > 0) {
              pathGraph.addLink(prev.id, originalPoint.id, removedWeight/removed);
            }
            simplifiedPathIndex += 1;
            prev = originalPoint;
            removedWeight = 0;
            removed = 0;
          } else {
            if (roots.has(originalPoint.id)) debugger;
            pathGraph.removeNode(originalPoint.id);
            removed += 1;
            totalRemoved += 1;
            removedWeight += originalPoint.weight;
          }
        }
      });
    });

    /*
    do {
      removedCount = 0;
      pathGraph.forEachNode(node => { 
        if (!node.links) throw new Error('Node without links? How so?');
        if (!node.data && node.links.length === 2 && canRemove(node.links[0], node.links[1])) {
          // this is potential candidate
          var mergedLink = getMergedLink(node.links[0], node.links[1])
          pathGraph.removeNode(node.id);
          removedCount += 1;
          pathGraph.addLink(mergedLink.fromId, mergedLink.toId, mergedLink.data);
        }
      });
      totalRemoved += removedCount;
    } while(removedCount > 0)
    */

    console.log('After simplification: ', pathGraph.getLinksCount() + ' edges, ' + pathGraph.getNodesCount() + ' nodes');
    console.log('Removed nodes: ' + totalRemoved)
  }

  function canRemove(edge1, edge2) {
    // TODO: This should probably be moved out of here.
    // The idea here, is that we don't want to remove edges that point to different
    // directions.
    var angle1 = getAngle(edge1.fromId, edge1.toId);
    var angle2 = getAngle(edge2.fromId, edge2.toId);

    return Math.abs(angle1 - angle2) < 0.001;
  }

  function getAngle(a, b) {
    var xy1 = getXY(a);
    var xy2 = getXY(b);
    if (xy1.length !== 2 || xy2.length !== 2) throw new Error('Invalid edge key: ' + a + ',' + b);

    return Math.atan2(xy2[0] - xy1[0], xy2[1] - xy2[1]);
  }

  function getXY(a) {
    return a.split(',').map(v => Number.parseFloat(v));
  }

  function getMergedLink(edge1, edge2) {
    var data = (edge1.data + edge2.data)/2;
    var fromId, toId;
    // we remove shared part:
    if (edge1.toId == edge2.fromId) {
      fromId = edge1.fromId;
      toId = edge2.toId;
    } else if (edge1.fromId === edge2.toId) {
      fromId = edge1.toId;
      toId = edge2.fromId;
    } else if (edge1.fromId === edge2.fromId) {
      fromId = edge1.toId;
      toId = edge2.toId;
    } else if (edge2.toId === edge1.toId) {
      fromId = edge2.fromId;
      toId = edge1.fromId;
    } else {
      throw new Error('No shared part between edges.')
    }
    // make sure we order edges according to our rules:

    if(fromId >= toId) {
      var t = fromId;
      fromId = toId;
      toId = t;
    }
    return {
      fromId: fromId,
      toId: toId,
      data: data
    }
  }

  function forEachEdge(cb) {
    pathGraph.forEachLink(cb);
    //seenCount.forEach(cb);
  }

  function rememberPath(path, startId, endId) {
    if (path.length < 1) throw new Error('Empty path?');

    var from = path[0];
    for (var i = 1; i < path.length; ++i) {
      var to = path[i];
      rememberEdge(from, to);
      from = to;
    }

    // Remember bound nodes.
    var node = pathGraph.getNode(path[0].id);
    node.data = { node: startId }
    roots.add(node.id);

    node = pathGraph.getNode(path[path.length - 1].id);
    node.data = { node: endId }
    roots.add(node.id);
  }

  function getSeenCount(from, to) {
    //var key = getEdgeKey(from, to);
    var fromId = getFrom(from, to);
    var toId = getTo(from, to);
    var link = pathGraph.getLink(fromId, toId)
    return (link && link.data) || 0;
  }

  function rememberEdge(from, to) {
    //var key = getEdgeKey(from, to);
    var fromId = getFrom(from, to);
    var toId = getTo(from, to);
    var link = pathGraph.getLink(fromId, toId)
    if (!link) {
      link = pathGraph.addLink(fromId, toId, 1);
    } else {
      link.data += 1;
    }
    var seenValue =link.data; // (seenCount.get(key) || 0) + 1;
    if (seenValue > maxSeenValue) maxSeenValue = seenValue;
    //seenCount.set(key, seenValue);
  }

  function getFrom(from, to) {
    return from.id < to.id ? from.id : to.id;
  }

  function getTo(from, to) {
    return from.id < to.id ? to.id : from.id;
  }

  function getEdgeKey(from, to) {
    return from.id < to.id ? from.id + ';' + to.id : to.id + ';' + from.id;
  }
}
