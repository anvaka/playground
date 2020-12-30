import simplify from './simplify.js'
/**
 * A single corner of a polygon
 */
const pathSimplificationFactor = 128;
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
    const polygon = map.getPolygon(polygonId);
    if (!polygon) return;
    let segment = [];
    let lastProcessedNode = 0;
    while(lastProcessedNode < polygon.length) {
      segment.push(polygon[lastProcessedNode]);

      if (polygon[lastProcessedNode].degree === 3) {
        this.makeInternalSegmentSimple(polygonId, segment);
        segment = [polygon[lastProcessedNode]];
      }
      lastProcessedNode += 1;
    }
    this.makeInternalSegmentSimple(polygonId, segment);
  }

  makeInternalSegmentSimple(polygonId, segment) {
    // let newPath = orthogonalizePath(segment, 1800);
    let newPath = simplifyPath(segment, pathSimplificationFactor);
    let firstTwoDegree = segment.find(x => x.degree === 2);
    let polygons = new Set([polygonId]);
    if (firstTwoDegree) {
      this.graph.getNode(firstTwoDegree.id).data.connections.forEach(connectionId => {
        polygons.add(connectionId)
      });
    }
    let polygonIds = Array.from(polygons);

    for (let i = 1; i < segment.length; ++i) {
      this.removeSegment(segment[i - 1].id, segment[i].id);
    }
    for (let i = 1; i < newPath.length; ++i) {
      polygonIds.forEach(polygonId => {
        let shouldUpdateSegment = false;
        if (this.graph.hasNode(newPath[i - 1].id)) {
          shouldUpdateSegment = true;
          this.graph.getNode(newPath[i - 1].id).data.coordinates = newPath[i - 1].point;
        }
        if (this.graph.hasNode(newPath[i].id)) {
          shouldUpdateSegment = true;
          this.graph.getNode(newPath[i].id).data.coordinates = newPath[i].point;
        } 
        
        let from = newPath[i - 1].point;
        let to = newPath[i].point;
        if (shouldUpdateSegment) {
          let fromKey = newPath[i - 1].id || this.getSegmentKey(newPath[i - 1].point)
          let toKey = newPath[i].id || this.getSegmentKey(newPath[i].point);
          if (fromKey > toKey) {
            let t = fromKey; fromKey = toKey; toKey = t;
            t = from; from = to; to = t;
          }


          if (!this.graph.hasNode(fromKey)) {
            this.graph.addNode(fromKey, new PolygonNode(from));
          }
          this.graph.getNode(fromKey).data.connect(polygonId);

          if (!this.graph.hasNode(toKey)) {
            this.graph.addNode(toKey, new PolygonNode(to));
          }
          this.graph.getNode(toKey).data.connect(polygonId);

          if (fromKey === toKey) return;

          if (!this.graph.hasLink(fromKey, toKey)) {
            this.graph.addLink(fromKey, toKey, new PolygonEdge(fromKey, toKey))
          }
        } else {
          this.addSegment(polygonId, from, to);
        }
      })
    }
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
    let startFrom = Array.from(points)[0];
    return this.getPolygonStartingFrom(startFrom, polygonId);
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
        id: nodeId,
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

function simplifyPath(path, minLength) {
  let res = simplify(path, minLength);
  let points = res.map(x => ({
    point: [x.point[0], x.point[1]],
    degree: x.degree,
    id: x.id
  }));

  let angleThreshold = Math.PI * 15 / 180;

  for (let i = 1; i < points.length; ++i) {
    let prev = points[i - 1];
    let current = points[i];
    let dx = current.point[0] - prev.point[0];
    let dy = current.point[1] - prev.point[1];
    let angle = Math.abs(Math.atan2(dy, dx));
    // if (Math.PI / 4 - angle  > 0 && Math.PI / 4 - angle < angleThreshold) {
    //   console.log('r')
    //   let rotated = rotateAroundPoint(prev.point, current.point,  Math.PI / 4 - angle)
    //   current.point[0] = rotated[0]
    //   current.point[1] = rotated[1]
    // }

    if (angle < angleThreshold || (Math.PI - angle < angleThreshold) ) {
      // console.log(`Angle between (${prev[0]},${prev[1]}) and (${current[0]},${current[1]}) is ${angle}. Correcting`)
      // equalize y coordinate;
      current.point[1] = prev.point[1];
      // else if (prev.degree < 3) prev.point[1] = current.point[1];
    } else if (Math.abs(Math.PI / 2 - angle) < angleThreshold) {
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

function orthogonalizePath(path, minLength) {
  let breakPoints = [];
  let l = 0;
  for (let i = 1; i < path.length- 1; ++i) {
    let prev = path[i - 1];
    let current = path[i];
    let dist = getSegmentLength(prev, current);
    if (dist + l >= minLength) {
      breakPoints.push(i);
      l = 0;
    } else {
      l += dist;
    }
  }
  
  let result = [path[0].point];
  breakPoints.forEach(pointIndex => {
    let target = path[pointIndex].point;
    let prev = result[result.length - 1];
    result.push([prev[0], target[1]])
    result.push(target);
  });
  result.push(path[path.length - 1].point);
  return result;
}

function getSegmentLength(a, b) {
  let dx = a.point[0] - b.point[0];
  let dy = a.point[1] - b.point[1];
  return Math.sqrt(dx * dx + dy * dy);
}

const map = new PolygonGraph();


function drawResults() {
  let appendTo = document.querySelector('#result');
  let polygons = map.getAllPolygons();

  map.polygonIdToNodeIds.forEach((nodes, polygonId) => {
      map.simplifyPolygonBorders(polygonId);
  });

  polygons = map.getAllPolygons();
  polygons.forEach(polygon => {
    let path = window.sivg('path', {
      d: getPolygonData(polygon),
      stroke: 'red',
      'stroke-width': 40,
      fill: 'transparent'
    })
    appendTo.appendChild(path)
    polygon.forEach(({point}) => {
      // let txt = window.sivg('text', {
      //   x: point[0],
      //   y: point[1],
      //   'fill': 'orange',
      //   'font-size': 42
      // });
      // txt.text(point.join(','));
      // appendTo.appendChild(txt)
    })
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

loadFromSVG();
// map.addSegment(0, [0, 0], [0, 600]);
// map.addSegment(0, [600, 600], [0, 600]);
// map.addSegment(0, [600, 600], [600, -100]);
// map.addSegment(0, [0, 0], [600, -100]);

// map.addSegment(1, [600, 600], [600, -100]);
// map.addSegment(1, [600, 600], [800, 800]);
// map.addSegment(1, [800, -600], [800, 800]);
// map.addSegment(1, [800, -600], [600, -100]);
drawResults();
// fetch('https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_1_states_provinces_shp.geojson', {
//   mode: 'cors'
// }).then(x => x.json()).then(x => {
//   console.log(x);
//   x.features.forEach((feature, polygonId) => {
//     feature.geometry.coordinates[0].forEach((pair, index, arr) => {
//       if (index > 0) {
//         map.addSegment(polygonId, arr[index - 1], arr[index])
//       }
//     })
//   });
//   drawResults();
// })