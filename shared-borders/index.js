/**
 * A single corner of a polygon
 */
class PolygonNode {
  constructor(coordinates) {
    this.coordinates = coordinates;
    this.connections = new Set();
  }

  connect(polygonId)  {
    this.connections.add(polygonId);
  }
}

class PolygonEdge {
  constructor(fromKey, toKey) {
    this.fromKey = fromKey;
    this.toKey = toKey;
  }
}

/**
 * Set of connected polygons with potentially shared borders
 */
class PolygonGraph {
  constructor() {
    // Maps polygon id to all node identifiers in this polygon
    this.polygonIdToNodeIds = new Map();
    this.graph = window.createGraph();
  }

  addSegment(polygonId, from, to) {
    let fromKey = this.getSegmentKey(from)
    let toKey = this.getSegmentKey(to)

    if (!this.polygonIdToNodeIds.has(polygonId)) this.polygonIdToNodeIds.set(polygonId, new Set());

    if (!this.graph.hasNode(fromKey)) {
      this.graph.addNode(fromKey, new PolygonNode(from));
      this.polygonIdToNodeIds.get(polygonId).add(fromKey);
    }
    if (!this.graph.hasNode(toKey)) {
      this.graph.addNode(toKey, new PolygonNode(to));
      this.polygonIdToNodeIds.get(polygonId).add(toKey);
    }

    if (fromKey > toKey) {
      let t = fromKey; fromKey = toKey; toKey = t;
    }

    this.graph.getNode(fromKey).data.connect(polygonId);
    this.graph.getNode(toKey).data.connect(polygonId);

    if (fromKey === toKey) return;

    if (!this.graph.hasLink(fromKey, toKey)) {
      this.graph.addLink(fromKey, toKey, new PolygonEdge(fromKey, toKey))
    }
  }

  getSegmentKey(segment) {
    return `${segment[0]},${segment[1]}`
  }

  getAllPolygons() {
    let polygons = [];

    this.polygonIdToNodeIds.forEach((points, polygonId) => {
      let startFrom = Array.from(points)[0];
      let polygon = this.getPolygonStartingFrom(startFrom, polygonId);
      polygons.push(polygon);
    });

    return polygons;
  }

  getPolygonStartingFrom(startFromNodeId, polygonId) {
    let queue = [startFromNodeId];
    let visited = new Set();
    let polygon = [];
    while (queue.length) {
      let nodeId = queue.shift();
      let polygonNode = this.graph.getNode(nodeId);
      if (polygonNode) visited.add(nodeId)
      else throw new Error('node is missing ' + nodeId);
      if (!polygonNode.links) throw new Error('Each node should be connected');

      polygon.push({
        point: polygonNode.data.coordinates,
        degree: polygonNode.links.length
      });

      this.graph.forEachLinkedNode(nodeId, otherNode => {
        if (!otherNode.data.connections.has(polygonId)) return; // this path doesn't connect our polygon, ignore.
        if (visited.has(otherNode.id)) return;
        queue.push(otherNode.id);
        return true;
      });
    }

    if (polygon.length <= 1) throw new Error('Empty polygon');
    // close the loop:
    polygon.push(polygon[0]);
    return polygon;
  }
}

const map = new PolygonGraph();
Array.from(document.querySelectorAll('path')).forEach((path, pathId) => {
  let points = path.getAttributeNS(null, 'd')
    .replace(/[MLZ]/i, '')
    .split(' ')
    .map(pair => pair.split(',').map(x => Number.parseFloat(x)))

  for (let i = 1; i < points.length; ++i) {
    map.addSegment(pathId, points[i - 1], points[i]);
  }
});

let appendTo = document.querySelector('#result');
let polygons = map.getAllPolygons();
polygons.forEach(polygon => {
  let path = window.sivg('path', {
    d: getPolygonData(polygon),
    stroke: 'black',
    'stroke-width': 10,
    fill: 'transparent'
  })
  appendTo.appendChild(path)
});

function getPolygonData(polygon) {
  return polygon.map(({point}, index) => index === 0 ? 'M' + point.join(',') + 'L': point.join(',')).join(' ');
}