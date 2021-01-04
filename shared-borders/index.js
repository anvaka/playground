import simplify from './simplify.js'
let appendTo = document.querySelector('#result');
/**
 * A single corner of a polygon
 */
const pathSimplificationFactor = 200;
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
    }
    this.polygonIdToNodeIds.get(polygonId).add(fromKey);

    if (!this.graph.hasNode(toKey)) {
      this.graph.addNode(toKey, new PolygonNode(to));
    }
    this.polygonIdToNodeIds.get(polygonId).add(toKey);

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

  removeSegment(fromKey, toKey) {
    if (fromKey > toKey) {
      let t = fromKey; fromKey = toKey; toKey = t;
    }
    let link = this.graph.getLink(fromKey, toKey);
    if (link) {
      this.graph.removeLink(link);
      this._removeZeroDegreeNode(fromKey);
      this._removeZeroDegreeNode(toKey);
    } else {
      console.error('trying to remove non-existing segment');
    }
  }

  _removeZeroDegreeNode(nodeId) {
    let node = this.graph.getNode(nodeId);
    if (node.links.length > 0) return;
    node.data.connections.forEach(polygonId => {
      this.polygonIdToNodeIds.get(polygonId).delete(nodeId);
    });
    this.graph.removeNode(nodeId);
  }

  simplifyPolygonBorders(polygonId) {
    const polygon = this.getPolygon(polygonId);
    if (!polygon) return;
    let segment = [];
    let lastProcessedNode = 0;

    while(lastProcessedNode < polygon.length) {
      let currentPoint = polygon[lastProcessedNode];
      segment.push(currentPoint);
      if (currentPoint.degree > 2 && segment.length > 1) {
        this.makeInternalSegmentSimple(polygonId, segment);
        // start a new segment
        segment = [currentPoint];
      }
      lastProcessedNode += 1;
    }
    this.makeInternalSegmentSimple(polygonId, segment);
  }

  makeInternalSegmentSimple(polygonId, segment) {
    let alreadySimplified = false;
    segment.forEach((point, index) => {
      if (point.degree === 2 && this.graph.getNode(point.id).simplified) alreadySimplified = true;
    });

    if (alreadySimplified) return;

    const newPath = simplifyPath(segment, pathSimplificationFactor);
    console.log('make simple: ', polygonId, segment, newPath);

    // validation
    segment.forEach((point, index, arr) => {
      if (index > 0 && index < arr.length - 1 && point.degree !== 2) {
        throw new Error('Only two degree nodes in the middle are allowed')
      }
    })

    // remember which segments we need to clean up:
    let segmentsToDelete = new Map();
    for (let i = 1; i < segment.length; ++i) {
      let fromKey = segment[i - 1].id;
      let toKey = segment[i].id;
      if (fromKey > toKey) {
        let t = fromKey; fromKey = toKey; toKey = t;
      }
      segmentsToDelete.set(fromKey + toKey, { fromKey, toKey });
    }

    let graph = this.graph;
    let self = this;

    for (let i = 1; i < newPath.length; ++i) {
      if (!this.graph.hasNode(newPath[i].id)) {
        throw new Error('How come there is no such node?');
      } 
      
      let from = newPath[i - 1];
      let to = newPath[i];
      if (from.id > to.id) { let t = from; from = to; to = t; }
      // This is a good segment, let's keep it:
      segmentsToDelete.delete(from.id + to.id);

      if (from.id === to.id) {
        // It should probably be safe to ignore this, but not sure how you got here.
        throw new Error(`Same key, be warned: ${from.id}`);
      }

      if (!this.graph.hasLink(from.id, to.id)) {
        console.log(`Adding link ${from.id} -> ${to.id}`)
        this.graph.addLink(from.id, to.id, new PolygonEdge(from.id, to.id))
      }
    }
    
    // let's remember, that we simplified this segment already, so that we don't simplify it a few times:
    segment.forEach((point, index) => {
      let node = this.graph.getNode(point.id);
      if (node) node.simplified = true;
    });

    // Finally, clean up those segments that are no longer needed:
    segmentsToDelete.forEach(({fromKey, toKey}) => {
      this.removeSegment(fromKey, toKey)
    });
  }

  getSegmentKey(segment) {
    return `${segment[0]},${segment[1]}`
  }

  getAllPolygons() {
    let polygons = [];
    this.polygonIdToNodeIds.forEach((points, polygonId) => polygons.push(this.getPolygon(polygonId)));
    return polygons.filter(x => x);
  }

  getPolygon(polygonId) {
    let points = this.polygonIdToNodeIds.get(polygonId);
    let allPoints = Array.from(points);
    let startFrom = allPoints.find(x => this.graph.getNode(x).links.length > 2) || allPoints[0];
    return this.getPolygonStartingFrom(startFrom, polygonId);
  }

  getPolygonStartingFrom(startFromNodeId, polygonId) {
    let queue = [startFromNodeId];
    let visited = new Set();
    let polygon = [];
    let graph = this.graph

    while (queue.length) {
      let nodeId = queue.shift();
      let polygonNode = this.graph.getNode(nodeId);
      if (polygonNode) visited.add(nodeId)
      else throw new Error('node is missing ' + nodeId);
      if (!polygonNode.links) throw new Error('Each node should be connected');

      polygon.push({
        id: nodeId,
        get point() {
          // We want to make sure to always read from life graph, so that
          // intermediate update to node's position are actually permanent:
          return graph.getNode(this.id).data.coordinates;
        }, 
        get degree() {
          return graph.getNode(this.id).links.length;
        }
      });

      this.graph.forEachLinkedNode(nodeId, otherNode => {
        if (!otherNode.data.connections.has(polygonId)) {
          return; // this path doesn't connect our polygon, ignore.
        }
        if (visited.has(otherNode.id)) {
          return;
        }
        queue.push(otherNode.id);
        return true;
      });
    }

    let pointsInPolygon = this.polygonIdToNodeIds.get(polygonId);
    if (pointsInPolygon.size !== polygon.length) {
      throw new Error('Missing points in the polygon')
    }
    if (polygon.length <= 1) throw new Error('Empty polygon');
    // close the loop:
    polygon.push(polygon[0]);

    return polygon;
  }

  assertIntegrity() {
    let polygons = this.getAllPolygons()
    polygons.forEach(polygon => {
      if (!pointsEqual(polygon[0].point, polygon[polygon.length - 1].point)) {
        console.error('Polygon end point is wrong', polygon)
        throw new Error('Polygon end point is wrong');
      }
    });
    return true;
  }
}

function pointsEqual(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

function simplifyPath(path, minLength) {
  let points = simplify(path, minLength);
  if (points.length === 2 && pointsEqual(points[0].point, points[1].point)) {
    // Cannot further simplify the path
    points = path;
  }
  let angleThreshold = Math.PI * 10 / 180;

  // if (0)
  //for (let j = 1; j < 2; ++j)
  for (let i = 1; i < points.length; ++i) {
    let prev = points[i - 1];
    let current = points[i];
    let dx = current.point[0] - prev.point[0];
    let dy = current.point[1] - prev.point[1];
    let angle = Math.abs(Math.atan2(dy, dx));

    // TODO:: This operation can create self intersecting polygons. Need to 
    // check validity of the move before performing it:
    if (angle < angleThreshold || (Math.PI - angle < angleThreshold) ) {
      // equalize Y coordinate, as the edge is almost horizontal:
      current.point[1] = prev.point[1];
    } 
    if (Math.abs(Math.PI / 2 - angle) < angleThreshold ) {
      // equalize X coordinate as the edge is almost vertical:
      current.point[0] = prev.point[0];
    }
  }

  return points;
}

function rotateAroundPoint(pivotPoint, targetPoint, angle) {
  let [cx, cy] = pivotPoint;
  let [tx, ty] = targetPoint;
  let x = tx - cx;
  let y = ty - cy;
  let xNew = x * Math.cos(angle) - y * Math.sin(angle);
  let yNew = x * Math.sin(angle) + y * Math.cos(angle);
  return [cx + xNew, cy + yNew];
}

function getSegmentLength(a, b) {
  let dx = a.point[0] - b.point[0];
  let dy = a.point[1] - b.point[1];
  return Math.sqrt(dx * dx + dy * dy);
}

const map = new PolygonGraph();

function drawResults() {
  let polygons = map.getAllPolygons();

  map.polygonIdToNodeIds.forEach((nodes, polygonId) => {
    map.simplifyPolygonBorders(polygonId);
  });

  polygons = map.getAllPolygons();
  polygons.forEach((polygon, id) => {
    drawPolygonPath(polygon); // , id === 0? 'orange': 'transparent');
    drawTextLabels(polygon);
  });
}

function drawPolygonPath(polygon, color = 'rgb(255, 0, 0, 0.5)') {
  let path = window.sivg('path', {
    d: getPolygonData(polygon),
    stroke: color,
    'stroke-width': 40,
    fill: 'transparent'
  })
  appendTo.appendChild(path)
}

function drawTextLabels(polygon, fill = 'orange', fontSize = 42) {
  polygon.forEach(({point, id}) => {
    let txt = window.sivg('text', {
      x: point[0],
      y: point[1],
      fill: fill,
      'font-size': fontSize
    });
    // txt.text(point.join(',') + ' ' + id);
    txt.text( id);
    appendTo.appendChild(txt)
  });
}

function loadFromSVG() {
  Array.from(document.querySelectorAll('path')).forEach((path, pathId) => {
    let points = path.getAttributeNS(null, 'd')
      .replace(/[MLZ]/i, '')
      .split(' ')
      .map(pair => pair.split(',').map(x => Number.parseFloat(x)))

    for (let i = 1; i < points.length; ++i) {
      map.addSegment(pathId, points[i - 1], points[i]);
    }
  });
}

function getPolygonData(polygon) {
  return polygon.map(({point}, index) => index === 0 ? 'M' + point.join(',') + 'L': point.join(',')).join(' ');
}

// map.addSegment(0, [0, 0], [0, 600]);
// map.addSegment(0, [600, 600], [0, 600]);
// map.addSegment(0, [600, 600], [600, -100]);
// map.addSegment(0, [0, 0], [600, -100]);

// map.addSegment(1, [600, 600], [600, -100]);
// map.addSegment(1, [600, 600], [800, 800]);
// map.addSegment(1, [800, -600], [800, 800]);
// map.addSegment(1, [800, -600], [600, -100]);
// loadFromSVG();
// drawResults();
fetch('https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_1_states_provinces_shp.geojson', {
// fetch('https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_1_states_provinces_shp.geojson', {
  mode: 'cors'
}).then(x => x.json()).then(x => {
  console.log(x);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  x.features.forEach((feature, polygonId) => {
    //if (polygonId > 44) return;
    feature.geometry.coordinates[0].forEach((pair, index, arr) => {
      if (index > 0) {
        let from = geoTransform(arr[index - 1]);
        let to = geoTransform(arr[index]);
        expandBorders(from); expandBorders(to)
        map.addSegment(polygonId, from, to)
      }
    })
  });
  map.assertIntegrity();
  console.log(null, 'viewBox', `${minX} ${minY} ${maxX - minX} ${maxY - minY}`)
  drawResults();
  function expandBorders([x, y]) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
});

function geoTransform([lon, lat]) {
  var y = ((-1 * lat) + 90) * (446 / 180);
  var x = (lon + 180) * (1000 / 360);
  return [x * 500, y * 500 ].map(x => Math.round(x));

}