const findShortestPaths = require('./findShortestPath');
const cellKey = require('./cellKey');
const createGridGraph = require('./createGridGraph');
const createGraph = require('ngraph.graph');
const getBBoxAndRects = require('./getBBoxAndRects');
const RoadAccumulator = require('./roadAccumulator') ;
const Rect = require('../../lib/geom/Rect')
const bus = require('../../lib/bus')
const getDelaunayTesselation = require('./tesselation/getDelaunayTesselation');

module.exports = gridRoads;

const drawDebugRects = false;

function gridRoads(graph, layout, offset) {
  let {bbox, rects} = getBBoxAndRects(graph, layout);

  let cellSize = 10;
  let maxCols = Math.ceil(bbox.width/cellSize);
  let maxRows = Math.ceil(bbox.height/cellSize);
  let rectangleById = new Map();

  let visRect = [];

  // let grid = createGraph({uniqueLinkId: false});
  let grid = createGridGraph(bbox.width, bbox.height, cellSize) ;

  let delaunay = getDelaunayTesselation(rects, cellSize);
  mergeDelaunayIntoGrid(grid, delaunay);

  // We mark each cell that contain original node, so that path finding
  // considers them impassible
  rects.forEach(r => {
    rectangleById.set(r.id, r);
    if (r.width > cellSize) {
      let leftTop = toGridCoordinate(r.left, r.top);
      let rightBottom = toGridCoordinate(r.right, r.bottom);
      for(let col = leftTop.col; col < rightBottom.col; ++col) {
        for (let row = leftTop.row; row < rightBottom.row; ++row) {
          let gridKey = cellKey(col, row);
          let node = grid.getNode(gridKey);
          if (!node) continue;
          node.data.src_key = r.id;

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

  var firstPassRoads = new RoadAccumulator();
  let currentFromId;
  let currentToId;

  collectRoads(firstPassRoads);
  // Note: we can experiment with multi-pass for same edge memory:
  // Should gias routing towards seen roads.
  let finalRoads = new RoadAccumulator();
  collectRoads(finalRoads);

  return convertAccumulatorToLines(finalRoads);
  
  function convertAccumulatorToLines(accumulator) {
    return accumulator.getLines().map(l => {
      let from = toGraphCoord(l.from.col, l.from.row);
      let to = toGraphCoord(l.to.col, l.to.row);
      let c2 = cellSize/2;
      // if (from.row === to.row) {
      //   from.y += c2;
      //   to.y += c2;
      // }
      // if (from.col === to.col) {
      //   from.x += c2;
      //   to.x += c2;
      // }
      return {
        width: l.width,
        from: from,
        to: to,
      }
    });
  }

  function collectRoads(roadAccumulator) {
    graph.forEachLink(l => findRoadsForLink(l, roadAccumulator));
  }

  function findRoadsForLink(link, roadAccumulator) {
    currentFromId = link.fromId;
    currentToId = link.toId;

    let fromPos = getGridPosByNodeId(link.fromId);
    let toPos = getGridPosByNodeId(link.toId);

    let fromRect = rectangleById.get(link.fromId);
    let toRect = rectangleById.get(link.toId);

    let fW = Math.ceil(fromRect.width/cellSize);
    let fH = Math.ceil(fromRect.height/cellSize);
    let tW = Math.ceil(toRect.width/cellSize);
    let tH = Math.ceil(toRect.height/cellSize);

    let colOffset = 0;
    let rowOffset = 0;

    if (fromRect.cx < toRect.cx) {
      fromPos.col += Math.floor(fW/2) + 1
      toPos.col -= Math.floor(tW/2)
    } else if (fromRect.cx > toRect.cx) {
      fromPos.col -= Math.floor(fW/2)
      toPos.col += Math.floor(tW/2) + 1
    }

    if (fromRect.cy < toRect.cy) {
      fromPos.row += Math.floor(fH/2) + 1
      toPos.row -= Math.floor(tH/2)
    } else if (fromRect.cy > toRect.cy) {
      fromPos.row -= Math.floor(fH/2)
      toPos.row += Math.floor(tH/2) + 1
    }

    let fromId = cellKey(fromPos.col, fromPos.row);
    let toId = cellKey(toPos.col, toPos.row);
    
    findInGridSpace(fromId, toId, roadAccumulator);
  }

  function findInGridSpace(fromId, toId, roadAccumulator) {
    // TODO: remove global dependency on currentFromId/currenToId
    let shortestPaths = findShortestPaths(grid, getCityEdgeLength, (node) => {
      return node.data.src_key === currentToId;
    });
    let path = shortestPaths(fromId, toId); 

    rememberPath(path);
    // path = path.filter(p => !('src_key' in p));
    addPathToRoadAccumulator(roadAccumulator, path);
  }

  function getGridPosByNodeId(nodeId) {
    let pos = layout.getNodePosition(nodeId);
    let gridPos = toGridCoordinate(pos.x, pos.y); //, /* offset = */ true);
    return gridPos;
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
    let dx = aPos.col - bPos.col
    let dy = aPos.row - bPos.row
    let edgeKey = getEdgeMemoryId(aPos, bPos);
    let seenCount = edgeIdToSeenCount.get(edgeKey) || 0;
    let lengthReducer = seenCount === 0 ? 1 : (Math.exp(-0.8 * seenCount + Math.log(1 - 0.5)) + 0.5)

    // let dist = Math.sqrt(dx * dx + dy * dy);
    let dist = Math.abs(dx) + Math.abs(dy);
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
    let fromId = cellKey(from.col, from.row);
    let toId = cellKey(to.col, from.row);

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

  function toGraphCoord(col, row) {
    let startX = offset.x + bbox.left;
    let startY = offset.y + bbox.top;

    return {
      x: startX + col * cellSize,
      y: startY + row * cellSize
    }
  }

  function toGridCoordinate(x, y) {
    let col = Math.floor(maxCols * (x - bbox.left)/bbox.width); 
    let row = Math.floor(maxRows * (y - bbox.top)/bbox.height);

    if (col < 0) throw new Error('negative col')
    if (row < 0) throw new Error('negative row')

    return { col, row };
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

      let fromGridCoord = toGridCoordinate(from.x, from.y);
      let toGridCoord = toGridCoordinate(to.x, to.y);

      let fromKey = cellKey(fromGridCoord.col, fromGridCoord.row);
      let toKey = cellKey(toGridCoord.col, toGridCoord.row);

      if (!grid.getNode(fromKey)) {
        grid.addNode(fromKey, {
          row: fromGridCoord.row,
          col: fromGridCoord.col,
          src_key: l.fromId
        })
      }

      if (!grid.getNode(toKey)) {
        grid.addNode(toKey, {
          row: toGridCoord.row,
          col: toGridCoord.col,
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