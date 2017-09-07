const findShortestPaths = require('./findShortestPath');
const cellKey = require('./cellKey');
const createGridGraph = require('./createGridGraph');
const getBBoxAndRects = require('./getBBoxAndRects');
const RoadAccumulator = require('./roadAccumulator') ;
const Rect = require('../../lib/geom/Rect')
const bus = require('../../lib/bus')
const getDelaunayTesselation = require('./tesselation/getDelaunayTesselation');
//const aStar = require('./path/a-star/bidirectional');
const aStar = require('./path/a-star/index');

module.exports = gridRoads;

const drawDebugRects = false;

function gridRoads(graph, layout) {
  let {bbox, rects} = getBBoxAndRects(graph, layout);

  let cellSize = 10;
  let rectangleById = new Map();

  let visRect = [];

  let grid = createGridGraph(bbox, cellSize) ;

  let delaunay = getDelaunayTesselation(rects, cellSize);
  mergeDelaunayIntoGrid(grid, delaunay);

  // We mark each cell that contain original node, so that path finding
  // considers them impassible
  rects.forEach(r => {
    rectangleById.set(r.id, r);
    if (r.width > cellSize) {
      let leftTop = toPoint(r.left, r.top);
      let rightBottom = toPoint(r.right, r.bottom);
      for(let col = leftTop.x; col < rightBottom.x; col += cellSize) {
        for (let row = leftTop.y; row < rightBottom.y; row += cellSize) {
          let gridKey = cellKey(col, row);
          let node = grid.getNode(gridKey);
          if (!node) continue;
          node.data.src_key = r.id;

          let coord = toPoint(col, row);
          visRect.push(new Rect({
            left: coord.x,
            top: coord.y,
            width: cellSize,
            height: cellSize
          }))
          // grid.removeNode(gridKey);
        }
      }
    } else {
      let colRow = toPoint(r.left, r.top);
      let gridKey = cellKey(colRow.x, colRow.y);
      grid.getNode(gridKey).data.src_key = r.id;
      //grid.removeNode(gridKey);
      visRect.push(r);
    }
  });

  if (drawDebugRects) {
    bus.fire('draw-rectangles', visRect, {
      key: 'rects', 
      color: {
        r: 1, g: 0, b: 0, a: 1.0
      }
    });
  }

  let edgeIdToSeenCount = new Map();

  var firstPassRoads = new RoadAccumulator();
  let aStarPathFinder;
  let currentFromId;
  let currentToId;

  collectRoads(firstPassRoads);
  // Note: we can experiment with multi-pass for same edge memory:
  // Should gias routing towards seen roads.
  // let finalRoads = new RoadAccumulator();
  // collectRoads(finalRoads);

  // return convertAccumulatorToLines(finalRoads);
  return convertAccumulatorToLines(firstPassRoads);
  
  function convertAccumulatorToLines(accumulator) {
    return accumulator.getLines().map(l => {
      let from = toPoint(l.from.x, l.from.y);
      let to = toPoint(l.to.x, l.to.y);
      let c2 = cellSize/2;
      from.x += c2; from.y += c2;
      to.x += c2; to.y += c2;
      return {
        width: l.width,
        from: from,
        to: to,
      }
    });
  }

  function collectRoads(roadAccumulator) {
    console.time('roads');

    let maxReducer = (Math.exp(-0.8 * grid.getLinksCount() + Math.log(1 - 0.5)) + 0.5)
    aStarPathFinder = aStar(grid, {
      heuristic(from, to) {
         let fromPos = from.data;
         let toPos = to.data;
         return aStar.l2(fromPos, toPos) * maxReducer * 0.9;
      },
      distance: getCityEdgeLength
    })

    console.log('Searching graph with ' + grid.getNodesCount() + ' nodes and ' + grid.getLinksCount() + ' edges');
    graph.forEachNode(n => {
      let fromPos = layout.getNodePosition(n.id);
      fromPos = movePosToGrid(fromPos);
      let fromId = cellKey(fromPos.x, fromPos.y);

      currentFromId = n.id;

      // TODO: explore this further.
      // aStarPathFinder.reset();
      graph.forEachLinkedNode(n.id, (otherNode) => {
        let toPos = layout.getNodePosition(otherNode.id);
        currentToId = otherNode.id;
        toPos = movePosToGrid(toPos);
        let toId = cellKey(toPos.x, toPos.y);
        findInGridSpace(fromId, toId, roadAccumulator);
      }, true)
    })
    console.timeEnd('roads');
  }

  function movePosToGrid (pos) {
    return {
      x: Math.floor(pos.x / cellSize) * cellSize,
      y: Math.floor(pos.y / cellSize) * cellSize,
    }
  }

  function findInGridSpace(fromId, toId, roadAccumulator) {
    // TODO: remove global dependency on currentFromId/currenToId
    // let shortestPaths = findShortestPaths(grid, getCityEdgeLength, (node) => {
    //   return node.data.src_key === currentToId;
    // });
    // let path = shortestPaths(fromId, toId); 
    let path = aStarPathFinder.find(fromId, toId).map(p => {
      // return grid.getNode(p).data;
      return (p).data;
    });

    rememberPath(path);
    // path = path.filter(p => !('src_key' in p));
    addPathToRoadAccumulator(roadAccumulator, path);
  }

  function rememberPath(path) {
    for (let i = 1; i < path.length; ++i) {
      let key = getEdgeMemoryId(path[i], path[i - 1]);
      edgeIdToSeenCount.set(key, (edgeIdToSeenCount.get(key) || 0) + 1)
    }
  }

  function getCityEdgeLength(a, b, link) {
    let aPos = a.data
    let bPos = b.data
    if ('src_key' in aPos) {
      if (aPos.src_key !== currentFromId && aPos.src_key !== currentToId) {
        // don't let enter other occupied nodes.
        return Number.POSITIVE_INFINITY;
      }
    }
    if ('src_key' in bPos) {
      if (bPos.src_key !== currentFromId && bPos.src_key !== currentToId) {
        return Number.POSITIVE_INFINITY;
      }
    }

    let dx = aPos.x - bPos.x
    let dy = aPos.y - bPos.y
    let edgeKey = getEdgeMemoryId(aPos, bPos);
    let seenCount = edgeIdToSeenCount.get(edgeKey) || 0;
    let lengthReducer = seenCount === 0 ? 1 : (Math.exp(-0.8 * seenCount + Math.log(1 - 0.5)) + 0.5)

    // let dist = Math.sqrt(dx * dx + dy * dy);
    let dist = Math.abs(dx) + Math.abs(dy);
    // return dist;
    let delaunayFactor = 1;
    if (link && link.data && link.data.delaunay) {
      let lengthFactor = link.data.lengthFactor;
      if (dist < 3.1) {
        delaunayFactor = 40; // we don't want this.
      } else if (lengthFactor < 0.02) {
        delaunayFactor = 30;
      } else if (lengthFactor < 0.2) {
        dist = Math.sqrt(dx * dx + dy * dy);
        delaunayFactor = 1.3
      } else if (lengthFactor < 0.5) {
        dist = Math.sqrt(dx * dx + dy * dy);
        delaunayFactor = 1.1
      } else {
        dist = Math.sqrt(dx * dx + dy * dy);
        delaunayFactor = 0.9;
      }
    }
    return dist * lengthReducer * delaunayFactor;
  }

  function getEdgeMemoryId(from, to) {
    let fromId = cellKey(from.x, from.y);
    let toId = cellKey(to.x, to.y);

    if (fromId < toId) {
      let t = fromId;
      fromId = toId;
      toId = t;
    }
    return fromId + '_' + toId;
  }

  function addPathToRoadAccumulator(roadAccumulator, path) {
    let from = path[0];
    for (let i = 1; i < path.length; ++i) {
      let to = path[i];
      roadAccumulator.addRoute(from, to)
      from = to;
    }
  }

  function toPoint(x, y) {
    return { x: x, y: y }
  }
  
  function mergeDelaunayIntoGrid(grid, delaunay) {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    delaunay.forEachLink(l => {
      let from = delaunay.getNode(l.fromId).data;
      let to = delaunay.getNode(l.toId).data;
      let dx = from.x - to.x;
      let dy = from.y - to.y;
      let d = Math.sqrt(dx * dx + dy * dy);
      if (d < min) min = d;
      if (d > max) max = d;
    });

    let lengthDistance = (max - min);

    delaunay.forEachLink(l => {
      let from = delaunay.getNode(l.fromId).data;
      let to = delaunay.getNode(l.toId).data;

      let fromKey = cellKey(from.x, from.y);
      let toKey = cellKey(to.x, to.y);

      if (!grid.getNode(fromKey)) {
        grid.addNode(fromKey, {
          x: from.x,
          y: from.y,
          src_key: l.fromId
        })
      }

      if (!grid.getNode(toKey)) {
        grid.addNode(toKey, {
          x: to.x,
          y: to.y,
          src_key: l.toId
        })
      }

      let alreadyHasThisLink = grid.hasLink(fromKey, toKey) || grid.hasLink(toKey, fromKey)
      if (!alreadyHasThisLink) {
        let dx = from.x - to.x;
        let dy = from.y - to.y;
        let d = Math.sqrt(dx * dx + dy * dy);
        let lengthFactor = lengthDistance ? d / lengthDistance : 0

        grid.addLink(fromKey, toKey, {
          delaunay: true,
          lengthFactor
        });
      }
    })
  }
}