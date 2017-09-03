const findShortestPaths = require('./findShortestPath');
const cellKey = require('./cellKey');
const createGridGraph = require('./createGridGraph');
const getBBoxAndRects = require('./getBBoxAndRects');

module.exports = gridRoads;

function gridRoads(graph, layout, offset) {
  let {bbox, rects} = getBBoxAndRects(graph, layout);

  let cellSize = 10;

  let grid = createGridGraph(bbox.width, bbox.height, cellSize) ;
  // We mark each cell that contain original node, so that path finding
  // considers its impassible
  rects.forEach(r => {
    let leftTop = toGridCoordinate(r.left, r.top);
    let rightBottom = toGridCoordinate(r.right, r.bottom);
    for(let col = leftTop.col; col <= rightBottom.col; ++col) {
      for (let row = leftTop.row; row <= rightBottom.row; ++row) {
        let gridKey = cellKey(col, row);
        grid.getNode(gridKey).data.src_key = r.id;
      }
    }
  });

  let edgeIdToSeenCount = new Map();

  var lines = [];

  graph.forEachLink(l => {
    let fromId = getGridNodeIdFromSrcNodeId(l.fromId);
    let toId = getGridNodeIdFromSrcNodeId(l.toId);
    let path = collectRoute(fromId, toId); 

    rememberPath(path);

    // Remove internal nodes
    let firstIndex = 0;
    while(firstIndex < path.length && ('src_key' in path[firstIndex])) firstIndex += 1;
    let lastIndex = path.length - 1;
    while(lastIndex > -1 && ('src_key' in path[lastIndex])) lastIndex -= 1;

    // path = path.filter(p => !('src_key' in p));
    // convertPathToLines(lines, path.slice(firstIndex - 1, lastIndex + 2)) // +2 since slice is exclusive
    convertPathToLines(lines, path) // +2 since slice is exclusive
  });

  return lines;

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

  function collectRoute(fromId, toId) {
    let shortestPaths = findShortestPaths(grid, getCityEdgeLength);
    const route = shortestPaths(fromId, toId)

    return route;

    function getCityEdgeLength(a, b) {
      let aPos = a.data
      let bPos = b.data
      if ('src_id' in aPos) {
        if (aPos.src_id !== fromId && aPos.src_id !== toId) {
          // don't let enter other occupied nodes.
          return Number.POSITIVE_INFINITY;
        }
      }
      if ('src_id' in bPos) {
        if (bPos.src_id !== fromId && bPos.src_id !== toId) {
          return Number.POSITIVE_INFINITY;
        }
      }
      let dx = aPos.col - bPos.col
      let dy = aPos.row - bPos.row
      let edgeKey = getEdgeMemoryId(aPos, bPos);
      let seenCount = edgeIdToSeenCount.get(edgeKey) || 0;
      let lengthReducer = seenCount === 0 ? 1 : (Math.exp(-0.8 * seenCount + Math.log(1 - 0.5)) + 0.5)

      return (Math.abs(dx) + Math.abs(dy)) * lengthReducer;
      //return Math.sqrt(dx * dx + dy * dy) * lengthReducer;
    }
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

  function convertPathToLines(lines, path) {
    let from = path[0];
    for (let i = 1; i < path.length; ++i) {
      let to = path[i];
      lines.push({
        from: toGraphCoord(from.col, from.row),
        to: toGraphCoord(to.col, to.row),
      });
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
