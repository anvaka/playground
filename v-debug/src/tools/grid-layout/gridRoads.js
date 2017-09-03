const BBox = require('../../lib/geom/BBox');
const findShortestPaths = require('./findShortestPath');
const forEachRectangleNode = require('./forEachRectangle');
const cellKey = require('./cellKey');
const createGridGraph = require('./createGridGraph');

module.exports = gridRoads;

function gridRoads(graph, layout, offset) {
  let rects = [];
  let bbox = new BBox();

  forEachRectangleNode(graph, layout, rect => {
    bbox.addRect(rect);
    rects.push(rect);
  });

  let cellSize = 10;

  if (false) return drawGrid(offset, bbox, cellSize);

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

    convertPathToLines(lines, path)
  });

  return lines;

  function getGridNodeIdFromSrcNodeId(nodeId) {
    let pos = layout.getNodePosition(nodeId);
    let gridPos = toGridCoordinate(pos.x, pos.y, /* offset = */ true);

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
      x: offset.x + col * cellSize - bbox.width/2,
      y: offset.y + row * cellSize - bbox.height/2,
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

function drawGrid(offset, bbox, cellSize) {
  let cols = Math.ceil(bbox.width/cellSize);
  let rows = Math.ceil(bbox.height/cellSize);
  let startX = offset.x - bbox.width/2 - cellSize/4;
  let startY = offset.y - bbox.height/2 - cellSize/4;

  let lines = [];

  for(let j = 0; j < cols; ++j) {
    lines.push({
      from: {
        x: startX + j * cellSize,
        y: startY
      }, 
      to: {
        x: startX + j * cellSize,
        y: startY + rows * cellSize
      }
    })
  }

  for(let j = 0; j < rows; ++j) {
    lines.push({
      from: {
        x: startX,
        y: startY + j * cellSize
      }, 
      to: {
        x: startX + cols * cellSize,
        y: startY + j * cellSize
      }
    })
  }

  return lines;
}