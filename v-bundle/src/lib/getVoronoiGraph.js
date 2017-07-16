const voronoi = require('d3-voronoi').voronoi
const createGraph = require('ngraph.graph');
const findShortestPaths = require('./findShortestPaths.js');

module.exports = getVoronoiGraph;

function getVoronoiGraph(layout, srcGraph) {
  let positions = getPositions();

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
  console.log(polygons);

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
    const route = shortestPaths(fromId, toId)
    const cellPath = route.map(p => {
      let polygon =  nodeIdToPolygon.get(p.id)
      let path = 'M' + point(polygon[0]) + polygon.slice(1).map(p => 'L' + point(p)).join(' ')
        + 'L' + point(polygon[0]);

      return path
    })

    return {
      route,
      cellPath,
      edgePath:  'M' + pointXY(route[0]) + route.slice(1).map(p => 'L' + pointXY(p)).join(' ')
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
      let dw = 5;
      let dh = 5;
      let x = pos.x;
      let y = pos.y;
      positions.push({
        x: x,
        y: y,
        src_id: n.id,
        id: n.id
      });
      const extended = false;
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
