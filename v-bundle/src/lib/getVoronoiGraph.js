const voronoi = require('d3-voronoi').voronoi
const createGraph = require('ngraph.graph');
const findShortestPaths = require('./findShortestPaths.js');

module.exports = getVoronoiGraph;

function getVoronoiGraph(layout, srcGraph) {
  let positions = getPositions();
  let edgeIdToSeenCount = new Map();

  const v = voronoi()
    .x(r => r.x)
    .y(r => r.y)
    .extent([[positions.bounds.minX, positions.bounds.minY], [
      positions.bounds.maxX,
      positions.bounds.maxY
    ]])

  let computed = v(positions)
  let vGraph = constructDualGraph(computed);
  console.log('Voronoi graph. Nodes: ' + vGraph.getNodesCount() + '; Edges: ' + vGraph.getLinksCount());
  let shortestPaths = findShortestPaths(vGraph);
  let polygons = computed.polygons()
  let nodeIdToPolygon = new Map();
  polygons.forEach(p => {
    nodeIdToPolygon.set(p.data.id, p);
  });

  return {
    getCells,
    getDelaunay,
    collectRoute,
    getVoronoiGraphGeometry
  }

  function getVoronoiGraphGeometry() {
    let nodes = [];
    let edges = [];
    vGraph.forEachNode(node => {
      let x = node.data.x;
      let y = node.data.y;
      nodes.push({
        id: node.id,
        x: x,
        y: y
      });
    });
    vGraph.forEachLink(link => {
      edges.push({
        from: vGraph.getNode(link.fromId).data,
        to: vGraph.getNode(link.toId).data,
      })
    });

    return { nodes, edges };
  }

  function collectRoute(fromId, toId) {
    let vshortestPaths = findShortestPaths(vGraph, getVoronoiEdgeLength);

    function getVoronoiEdgeLength(a, b) {
      let aPos = a.data
      let bPos = b.data
      if (aPos.src_id === aPos.id) {
        // this means we are not in the auxilary cell.
        // we don't want to enter there unless it's our destination
        if (aPos.id !== fromId && aPos.id !== toId) {
          return Number.POSITIVE_INFINITY;
        }
      }
      if (bPos.src_id === bPos.id) {
        // this means we are not in the auxilary cell.
        // we don't want to enter there unless it's our destination
        if (bPos.id !== fromId && bPos.id !== toId) {
          return Number.POSITIVE_INFINITY;
        }
      }
      let dx = aPos.x - bPos.x
      let dy = aPos.y - bPos.y
      let edgeKey = getEdgeMemoryId(aPos, bPos);
      let seenCount = edgeIdToSeenCount.get(edgeKey) || 0;
      let lengthReducer = seenCount === 0 ? 1 : (Math.exp(-0.8 * seenCount + Math.log(1 - 0.5)) + 0.5)

      // TODO: Length reducer?
      return Math.sqrt(dx * dx + dy * dy) * lengthReducer;
    }
    const route = vshortestPaths(fromId, toId)
    const routeGraph = createGraph({uniqueLinkIds: false});

    const cellPath = route.map(p => {
      let polygon =  nodeIdToPolygon.get(p.id)
      let path = 'M' + point(polygon[0]) + polygon.slice(1).map(p => 'L' + point(p)).join(' ')
        + 'L' + point(polygon[0]);

      appendPolygonToRouteGraph(polygon);

      return path
    })

    // const routeShortestPath = findShortestPaths(routeGraph, getEdgeLength);
    // let fromIdXY = pointXY(nodeIdToPolygon.get(fromId).data);
    // let toIdXY = pointXY(nodeIdToPolygon.get(toId).data);
    // const rp = routeShortestPath(fromIdXY, toIdXY)
    // const shortestPath = 'M' + pointXY(rp[0]) + rp.slice(1).map(p => 'L' + pointXY(p)).join(' ');
    // const shortestPathAsIs = rp;
    const shortestPath = ''
    const shortestPathAsIs = route;
    rememberPath(route);

    return {
      route,
      cellPath,
      edgePath: 'M' + pointXY(route[0]) + route.slice(1).map(p => 'L' + pointXY(p)).join(' '),
      shortestPath,
      shortestPathAsIs
    }

    function rememberPath(path) {
      for (let i = 1; i < path.length; ++i) {
        let key = getEdgeMemoryId(path[i], path[i - 1]);
        edgeIdToSeenCount.set(key, (edgeIdToSeenCount.get(key) || 0) + 1)
      }
    }

    function getEdgeLength(a, b) {
      let aPos = a.data
      let bPos = b.data
      let dx = aPos.x - bPos.x
      let dy = aPos.y - bPos.y
      let edgeKey = getEdgeMemoryId(aPos, bPos);
      let seenCount = edgeIdToSeenCount.get(edgeKey) || 0;
      let lengthReducer = seenCount === 0 ? 1 : 1/(seenCount + 1)

      return Math.sqrt(dx * dx + dy * dy) * lengthReducer
    }

    function getEdgeMemoryId(from, to) {
      let fromId = pointXY(from);
      let toId = pointXY(to);
      if (fromId < toId) {
        let t = fromId;
        fromId = toId;
        toId = t;
      }
      return fromId + '_' + toId;
    }

    function appendPolygonToRouteGraph(polygon) {
      let start = polygon[0]
      let isStartSink = polygon.data.id === fromId;
      let isEndSink = polygon.data.id === toId

      for (let i = 1; i < polygon.length; ++i) {
        let end = polygon[i]
        addPolyLink(start, end);
        start = end;
      }

      // complete the circle
      addPolyLink(start, polygon[0])

      let sinkNode;
      if (isStartSink || isEndSink) {
        sinkNode = [polygon.data.x, polygon.data.y]
        for (let i = 0; i < polygon.length; ++i) {
          // connect all corners from the center. TODO: Should we consider connecting delaunay intersection as well?
          addPolyLink(sinkNode, polygon[i]);
        }
      }
    }

    function addPolyLink(start, end) {
      let polyStartId = point(start);
      let polyEndId = point(end)

      if (routeGraph.hasLink(polyStartId, polyEndId) ||
        routeGraph.hasLink(polyEndId, polyStartId)) return;

      routeGraph.addNode(polyStartId, {
        x: start[0],
        y: start[1]
      });

      routeGraph.addNode(polyEndId, {
        x: end[0],
        y: end[1]
      })

      routeGraph.addLink(polyStartId, polyEndId);
    }
  }

  function getDelaunay() {
    return computed.links().map(l => ({
      from: l.source,
      to: l.target
    }));
  }

  function getCells() {
    return drawCells(computed.edges)
  }

  function drawCells(edges) {
    return edges.map(e => edgePath(e)).join(' ')
  }

  function edgePath(e) {
    return 'M' + point(e[0]) + 'L' + point(e[1]);
  }

  function point(p) {
    return p[0] + ',' + p[1]
  }

  function pointXY(p) {
    return p.x + ',' + p.y
  }

  function getPositions() {
    const positions = [];

    srcGraph.forEachNode(n => {
      const pos = layout.getNodePosition(n.id);
      let dw = 1;
      let dh = 1;
      let x = pos.x;
      let y = pos.y;
      positions.push({
        x: x,
        y: y,
        src_id: n.id,
        id: n.id
      });
      const extended = true;
      if (extended) {
        positions.push({
          id: n.id + '_0',
          src_id: n.id,
          x: x - dw,
          y: y - dh
        }, {
          id: n.id + '_1',
          src_id: n.id,
          x: x + dw,
          y: y + dh
        }, {
          id: n.id + '_2',
          src_id: n.id,
          x: x + dw,
          y: y - dh
        }, {
          id: n.id + '_3',
          src_id: n.id,
          x: x - dw,
          y: y + dh
        });
      }
    });

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    positions.forEach(pos => {
      if (pos.x < minX) minX = pos.x;
      if (pos.y < minY) minY = pos.y;
      if (pos.x > maxX) maxX = pos.x;
      if (pos.y > maxY) maxY = pos.y;
    })
    positions.bounds = { minX, minY, maxX, maxY };

    return positions;
  }
}

function constructDualGraph(voronoi) {
  const graph = createGraph({uniqueLinkIds: false});

  voronoi.edges.forEach(e => {
    if (!e.left || !e.right) return;

    let fromId = getNodeId(e.left);
    let toId = getNodeId(e.right)
    ensureNodeAdded(fromId, e.left)
    ensureNodeAdded(toId, e.right)

    if (graph.hasLink(fromId, toId) || graph.hasLink(toId, fromId)) return;

    graph.addLink(fromId, toId, e);
  })

  return graph;

  function ensureNodeAdded(nodeId, site) {
    if (graph.getNode(nodeId)) return;
    graph.addNode(nodeId, site.data);
  }

  function getNodeId(site) {
    return site.data.id;
  }
}
