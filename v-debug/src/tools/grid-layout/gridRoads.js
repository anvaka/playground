const findShortestPaths = require('./findShortestPath');
const cellKey = require('./cellKey');
const createGridGraph = require('./createGridGraph');
const getBBoxAndRects = require('./getBBoxAndRects');
const RoadAccumulator = require('./roadAccumulator') ;
const Rect = require('../../lib/geom/Rect')
const bus = require('../../lib/bus')

module.exports = gridRoads;

const drawDebugRects = false;

function gridRoads(graph, layout, offset) {
  let {bbox, rects} = getBBoxAndRects(graph, layout);

  let cellSize = 10;
  let maxCols = Math.ceil(bbox.width/cellSize);
  let maxRows = Math.ceil(bbox.height/cellSize);

  let visRect = [];

  let grid = createGridGraph(bbox.width, bbox.height, cellSize) ;
  // We mark each cell that contain original node, so that path finding
  // considers its impassible
  rects.forEach(r => {
    if (r.width > cellSize) {
      let leftTop = toGridCoordinate(r.left, r.top);
      let rightBottom = toGridCoordinate(r.right, r.bottom);
      for(let col = leftTop.col; col <= rightBottom.col; ++col) {
        for (let row = leftTop.row; row <= rightBottom.row; ++row) {
          let gridKey = cellKey(col, row);
          grid.getNode(gridKey).data.src_key = r.id;

          let coord = toGraphCoord(col, row);
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
      let colRow = toGridCoordinate(r.left, r.top);
      let gridKey = cellKey(colRow.col, colRow.row);
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
  // var lines = [];

  var roadAccumulator = new RoadAccumulator();
  let currentFromId;
  let currentToId;

  graph.forEachLink(l => {
    currentFromId = l.fromId;
    currentToId = l.toId;

//     let fromTo = getBestFromTo(l.fromId, l.toId);
    let fromId = getGridNodeIdFromSrcNodeId(l.fromId);
    let toId = getGridNodeIdFromSrcNodeId(l.toId);

    // TODO: remove global dependency on currentFromId/currenToId
    let shortestPaths = findShortestPaths(grid, getCityEdgeLength, (node) => {
      return node.data.src_key === currentToId;
    });
    let path = shortestPaths(fromId, toId); 

    rememberPath(path);

    // Remove internal nodes
    // path = path.filter(p => !('src_key' in p));
    // var startFrom = 0;
    // var endAt = path.length - 1;
    // while(startFrom < path.length && ('src_key' in path[startFrom])) startFrom += 1;
    // while(endAt > -1 && ('src_key' in path[endAt])) endAt -= 1;

    // path = path.slice(startFrom - 1, endAt + 2);
    path = path.filter(p => !('src_key' in p));
    // convertPathToLines(lines, path.slice(firstIndex - 1, lastIndex + 2)) // +2 since slice is exclusive
    convertPathToLines(roadAccumulator, path) // +2 since slice is exclusive
  });

  return roadAccumulator.getLines().map(l => {
    let from = toGraphCoord(l.from.col, l.from.row);
    let to = toGraphCoord(l.to.col, l.to.row);
    let c2 = cellSize/2;
    if (from.row === to.row) {
      from.y += c2;
      to.y += c2;
    }
    if (from.col === to.col) {
      from.x += c2;
      to.x += c2;
    }
    // from.x += cellSize/2;
    // from.y += cellSize/2;
    // to.x += cellSize/2;
    // to.y += cellSize/2;
    return {
      width: l.width,
      from: from,
      to: to,
    }
  }); //lines;

  // function getBestFromTo(fromId, toId) {
  //   let fromPoints = getConnectionPoints(fromId);
  //   let toPoints = getConnectionPoints(toId);

  // }

  // function getConnectionPoints(nodeId) {
  //   let pos = layout.getNodePosition(nodeId);
  //   let gridPos = toGridCoordinate(pos.x, pos.y); //, /* offset = */ true);
  // }

  function getGridNodeIdFromSrcNodeId(nodeId) {
    let pos = layout.getNodePosition(nodeId);
    let gridPos = toGridCoordinate(pos.x, pos.y); //, /* offset = */ true);

    return cellKey(gridPos.col, gridPos.row);
  }

  function rememberPath(path) {
    for (let i = 1; i < path.length; ++i) {
      let key = getEdgeMemoryId(path[i], path[i - 1]);
      edgeIdToSeenCount.set(key, (edgeIdToSeenCount.get(key) || 0) + 1)
    }
  }

  function getCityEdgeLength(a, b) {
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
    let dx = aPos.col - bPos.col
    let dy = aPos.row - bPos.row
    let edgeKey = getEdgeMemoryId(aPos, bPos);
    let seenCount = edgeIdToSeenCount.get(edgeKey) || 0;
    let lengthReducer = seenCount === 0 ? 1 : (Math.exp(-0.8 * seenCount + Math.log(1 - 0.5)) + 0.5)

    return (Math.abs(dx) + Math.abs(dy)) * lengthReducer;
  }

  function getEdgeMemoryId(from, to) {
    let fromId = cellKey(from.col, from.row);
    let toId = cellKey(to.col, from.row);

    if (fromId < toId) {
      let t = fromId;
      fromId = toId;
      toId = t;
    }
    return fromId + '_' + toId;
  }

  function convertPathToLines(roads, path) {
    let from = path[0];
    for (let i = 1; i < path.length; ++i) {
      let to = path[i];
      roads.addRoute(from, to)
      // lines.push({
      //   from: toGraphCoord(from.col, from.row),
      //   to: toGraphCoord(to.col, to.row),
      // });
      from = to;
    }
  }

  function toGraphCoord(col, row) {
    // return {
    //   x: offset.x + bbox.width * col/maxCols - bbox.width/2 - cellSize/2,
    //   y: offset.y + bbox.height * row/maxRows - bbox.height/2 + cellSize/2
    // }
    let startX = offset.x + bbox.left;
    let startY = offset.y + bbox.top;

    return {
      x: startX + col * cellSize,
      y: startY + row * cellSize
    }
    return {
      x: offset.x + col * cellSize - Math.floor((bbox.width/2)/cellSize) * cellSize,
      y: offset.y + row * cellSize - Math.floor((bbox.height/2)/cellSize) * cellSize
    }
    // return {
    //   x: (1 + col) * cellSize + Math.floor((offset.x - bbox.width / 2)/cellSize) * cellSize,
    //   y: (1 + row) * cellSize + Math.floor((offset.y - bbox.height / 2)/cellSize) * cellSize,
    // }
  }

  function toGridCoordinate(x, y) {
    let col = Math.floor(maxCols * (x - bbox.left)/bbox.width); 
    let row = Math.floor(maxRows * (y - bbox.top)/bbox.height);

    if (col < 0) throw new Error('negative col')
    if (row < 0) throw new Error('negative row')

    return { col, row };
  }
}
