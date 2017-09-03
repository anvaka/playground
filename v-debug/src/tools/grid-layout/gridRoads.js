const findShortestPaths = require('./findShortestPath');
const cellKey = require('./cellKey');
const createGridGraph = require('./createGridGraph');
const getBBoxAndRects = require('./getBBoxAndRects');
const RoadAccumulator = require('./roadAccumulator') ;

module.exports = gridRoads;

function gridRoads(graph, layout, offset) {
  let {bbox, rects} = getBBoxAndRects(graph, layout);

  let cellSize = 10;

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
        }
      }
    } else {
      let colRow = toGridCoordinate(r.cx, r.cy);
      let gridKey = cellKey(colRow.col, colRow.row);
      grid.getNode(gridKey).data.src_key = r.id;
    }
  });

  let edgeIdToSeenCount = new Map();

  // var lines = [];

  var roadAccumulator = new RoadAccumulator();
  let currentFromId;
  let currentToId;
  // TODO: remove global dependency on currentFromId/currenToId
  let shortestPaths = findShortestPaths(grid, getCityEdgeLength);

  graph.forEachLink(l => {
    currentFromId = l.fromId;
    currentToId = l.toId;

    let fromId = getGridNodeIdFromSrcNodeId(l.fromId);
    let toId = getGridNodeIdFromSrcNodeId(l.toId);

    let path = shortestPaths(fromId, toId); 

    rememberPath(path);

    // Remove internal nodes
    // path = path.filter(p => !('src_key' in p));
    var startFrom = 0;
    var endAt = path.length - 1;
    while(startFrom < path.length && ('src_key' in path[startFrom])) startFrom += 1;
    while(endAt > -1 && ('src_key' in path[endAt])) endAt -= 1;

    path = path.slice(startFrom - 1, endAt + 2);
    // convertPathToLines(lines, path.slice(firstIndex - 1, lastIndex + 2)) // +2 since slice is exclusive
    convertPathToLines(roadAccumulator, path) // +2 since slice is exclusive
  });

  return roadAccumulator.getLines().map(l => ({
    width: l.width,
    from: toGraphCoord(l.from.col, l.from.row),
    to: toGraphCoord(l.to.col, l.to.row),
  })); //lines;

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
    return {
      x: col * cellSize + Math.round((offset.x - bbox.width / 2)/cellSize) * cellSize,
      y: row * cellSize + Math.round((offset.y - bbox.height / 2)/cellSize) * cellSize,
    }
  }

  function toGridCoordinate(x, y, offset) {
    let col = Math.floor((x + bbox.width/2) / cellSize);
    let row = Math.floor((y + bbox.height/2) / cellSize);
    if (offset) {
      if (col === 0) col = 1;
      else col -= 1;

      if (row === 0) row = 1;
      else row -= 1;
    }
    if (col < 0) col = 0;
    if (row < 0) row = 0;

    let maxCols = Math.ceil(bbox.width/cellSize);
    let maxRows = Math.ceil(bbox.height/cellSize);
    if (col > maxCols) col = maxCols - 1;
    if (row > maxRows) row = maxRows - 1;
    return { col, row };
  }

  // let lines = [];
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

  return lines;
}
