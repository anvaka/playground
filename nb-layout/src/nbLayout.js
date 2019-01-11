// PLEASE, ignore this file. I'm just messing here. It does not represent anything
// neither it is indicative of my ability to write code :).

import BBox from './BBox';
import KDBush from 'kdbush';


// The algorithm is inspired by this paper https://ccl.northwestern.edu/2018/galan2018.pdf
// I modified a few things, and mostly using this to test ideas.
export default function nbLayout(graph, settings) {
  const random = require('ngraph.random').random(42)

  var api = {
    getNodePosition,
    step,
    setNodePosition,
    updateSettings
  };

  var degreeWeighted = true;
  var desiredWidth = 1300;
  var desiredHeight = 1300;
  var decay = 1;
  var k1 = 0.5;
  var k2 = 0.6;
  var k3 = 0.06;
  var k4 = 0; // This is not part of the original paper either, Just trying to push neighbors apart
  var edgeLength = 100;
  var stepNumber = 0;

  if (settings) {
    updateSettings(settings);
  }
  var nodes = new Map();
  var nodeArr = [];
  var maxDegree = 0;
  var maxAggDeg = 0;

  graph.forEachNode(function(n) {
    var nodeDeg = getDeg(n.id);
    if (nodeDeg > maxDegree) maxDegree = nodeDeg;
  });

  initLayout();
  
  return api;

  function updateSettings(newSettings) {
    if (!newSettings) return;
    if (Number.isFinite(newSettings.k1)) k1 = newSettings.k1;
    if (Number.isFinite(newSettings.k2)) k2 = newSettings.k2;
    if (Number.isFinite(newSettings.k3)) k3 = newSettings.k3;
    if (Number.isFinite(newSettings.k4)) k4 = newSettings.k4;
  }

  function initLayout() {
    graph.forEachNode(function(node) {
      var pos = {
        x: (random.nextDouble() - 0.0) * desiredWidth,
        y: (random.nextDouble() - 0.0) * desiredHeight,
        incX: 0,
        incY: 0,
        incLength: 0,
        aggDeg: 0,
        id: node.id
      };
      nodes.set(node.id, pos)
      nodeArr.push(pos);
    });

    graph.forEachLink(function(link) {
      var fromDeg = getDeg(link.fromId);
      var toDeg = getDeg(link.fromId);
      var from = nodes.get(link.fromId);
      var to = nodes.get(link.toId);

      from.aggDeg += toDeg;
      from.incLength += 1;
      to.aggDeg += fromDeg;
      to.incLength += 1;
    });

    nodes.forEach(node => {
      if (node.incLength) node.aggDeg /= node.incLength;
      if (node.aggDeg > maxAggDeg) maxAggDeg = node.aggDeg;
      node.incLength = 0;
    })
    rescale();
  }

  function getNodePosition(nodeId) {
    var p = nodes.get(nodeId);
    return p;
  }

  function setNodePosition(nodeId, x, y) {
    var pos = nodes.get(nodeId);
    pos.x = x;
    pos.y = y;
  }

  function step() {
    k1 *= decay;
    k2 *= decay;
    k3 *= decay;
    k4 *= decay;
    //if (stepNumber > 40) return;
    rescale();

    minimizeEdgeCrossings();
    minimizeEdgeLengthDifference();
    maximizeAngularResolution();

    // if (stepNumber % 1 === 0) {
    //   forceMove();
    // } 
    ensurePositions();
    stepNumber += 1;
    if (stepNumber % 10 === 0) {
      console.log(stepNumber)
    }
  }

  function getGraphBBox() {
    var graphBoundingBox = new BBox();

    graph.forEachLink(function(link) {
      var currentPos = nodes.get(link.fromId);
      currentPos.scaled = false;
      graphBoundingBox.addPoint(currentPos.x, currentPos.y);
      var otherPos = nodes.get(link.toId);
      otherPos.scaled = false;
      graphBoundingBox.addPoint(otherPos.x, otherPos.y);
    });
    return graphBoundingBox;
  }

  function rescale() {
    var bbox = getGraphBBox();
    var width = bbox.width;
    var height = bbox.height;

    graph.forEachLink(function(link) {
      var currentPos = nodes.get(link.fromId);
      if (!currentPos.scaled) {
        currentPos.x = ((currentPos.x - bbox.left)/width - 0.0) * desiredWidth
        currentPos.y = ((currentPos.y - bbox.top)/height - 0.0) * desiredHeight
        currentPos.scaled = true;
      }
      var otherPos = nodes.get(link.toId);
      if(!otherPos.scaled) {
        otherPos.x = ((otherPos.x - bbox.left)/width - 0.0) * desiredWidth
        otherPos.y = ((otherPos.y - bbox.top)/height - 0.0) * desiredHeight
        otherPos.scaled = true;
      }
    });
  }

  function getDeg(id) {
    var n = graph.getNode(id);
    if (n && n.links) return n.links.length;
    return 0;
  }

  function ensurePositions() {
    nodes.forEach((p, key) => {
      if (Number.isFinite(p.x) && Number.isFinite(p.y)) return;
       throw new Error('ugh' + key)
    })
  }

  function processIncomingMessages() {
    nodes.forEach(function(pos) {
      pos.x = (pos.incX + pos.x)/(pos.incLength + 1);
      pos.y = (pos.incY + pos.y)/(pos.incLength + 1);
      pos.incLength = 0;
      pos.incX = 0;
      pos.incY = 0;
    });
  }

  function minimizeEdgeCrossings() {
    graph.forEachLink(function(link) {
      var currentPos = nodes.get(link.fromId);
      var otherPos = nodes.get(link.toId);
      var dx = currentPos.x - otherPos.x;
      var dy = currentPos.y - otherPos.y;
      otherPos.incX += otherPos.x + k1 * dx;
      otherPos.incY += otherPos.y + k1 * dy;
      otherPos.incLength += 1;

      currentPos.incX += currentPos.x - k1 * dx;
      currentPos.incY += currentPos.y - k1 * dy;
      currentPos.incLength += 1;
    });

    processIncomingMessages();
  }

  function minimizeEdgeLengthDifference() {
    var desLength = 0;
    graph.forEachLink(function(link) {
      var currentPos = nodes.get(link.fromId);
      var otherPos = nodes.get(link.toId);
      var dx = otherPos.x - currentPos.x;
      var dy = otherPos.y - currentPos.y;
      var l = Math.sqrt(dx * dx + dy * dy);
      if (l > desLength) desLength = l;
    });

    edgeLength = desLength;

    graph.forEachLink(function(link) {
      //currentPos -> u, otherPos -> v
      var formPos = nodes.get(link.fromId);
      var toPos = nodes.get(link.toId);
      var dx = toPos.x - formPos.x;
      var dy = toPos.y - formPos.y;
      var l = Math.sqrt(dx * dx + dy * dy);
      while (l < 1e-10) {
        dx = (random.nextDouble() - 0.5);
        dx = (random.nextDouble() - 0.5);
        l = Math.sqrt(dx * dx + dy * dy);
      }

      // ddx = k2 * (desLength - l) * dx/l;
      // ddy = k2 * (desLength - l) * dy/l;


      // This `tR` coefficient wasn't part of the original paper. I just wanted to scale
      // edge length based on node degree. It gives a bit better results, but still can be improved.
      var tR = degreeWeighted ? getDeg(link.toId)/maxDegree : 1;
      toPos.incX += toPos.x + k2 * (desLength - l) * dx/l * tR;
      toPos.incY += toPos.y + k2 * (desLength - l) * dy/l * tR;
      toPos.incLength += 1;

      // same drill with `tF`.
      var tF = degreeWeighted ? getDeg(link.fromId)/maxDegree : 1;
      formPos.incX += formPos.x - k2 * (desLength- l) * dx/l * tF;
      formPos.incY += formPos.y - k2 * (desLength- l) * dy/l  * tF;
      formPos.incLength += 1;
    });

    processIncomingMessages();
  }

  function maximizeAngularResolution() {
    graph.forEachNode(function(node) {
      var currentPos = nodes.get(node.id);
      var neighbors = [];
      graph.forEachLinkedNode(node.id, function(other) {
        var otherPos = nodes.get(other.id);
        var dx = otherPos.x - currentPos.x;
        var dy = otherPos.y - currentPos.y;
        var angle = Math.atan2(dy, dx) + Math.PI;
        neighbors.push({
          pos: otherPos,
          angle,
          strength: 1 
        });
      });
      if (neighbors.length < 2) return;
      // if (Math.random() < 0.4) return;
      // if (Math.random() < 0.001) node.ascending = undefined;
      if (node.ascending === undefined) {
        node.ascending = Math.random() < 0.5;
      }
      // node.ascending; //
      var ascending = node.ascending; // Math.random() > 0.50;
      neighbors.sort((a, b) => a.angle - b.angle);

      var desiredAngle = 2 * Math.PI / neighbors.length;
      var direction = ascending ? 1 : -1;

      var idx = 0;
      var startFrom = Math.round(Math.random() * (neighbors.length - 1));
      while (idx < neighbors.length) {
        var i = (startFrom + idx) % neighbors.length;
        idx += 1;
        var curr = neighbors[i];
        var next, curAngle;
        var nextIndex = i + direction;
        if (nextIndex === neighbors.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = neighbors.length - 1;

        next = neighbors[nextIndex];
        curAngle = (next.angle - curr.angle) * direction;

        if (curAngle < 0) curAngle += 2 * Math.PI;

        if (curAngle < desiredAngle) continue;

        var otherPos = curr.pos;
        var newAngle = curr.strength * k3 * (curAngle - desiredAngle) * direction;
        var rPoint = rotate(currentPos, otherPos, newAngle);
        otherPos.incX += rPoint.x;
        otherPos.incY += rPoint.y;
        otherPos.incLength += 1;
      }
    });

    processIncomingMessages();
  }

  function rotate(center, point, alpha) {
    var x = point.x - center.x;
    var y = point.y - center.y;

    var nx = Math.cos(alpha) * x - Math.sin(alpha) * y;
    var ny = Math.sin(alpha) * x + Math.cos(alpha) * y;

    return {
      x: nx + center.x,
      y: ny + center.y
    }
  }

  function forceMove() {
    var before = getGraphBBox();
    const points = new KDBush(nodeArr, p => p.x, p => p.y);
    nodeArr.forEach((pos, idx) => {
      var sx = 0, sy = 0, count = 0;
      var neighbors = points.within(pos.x, pos.y, edgeLength/2);
      neighbors.forEach(otherIndex => {
        if (otherIndex === idx) return;

        var other = nodeArr[otherIndex];
        var dx = pos.x - other.x;
        var dy = pos.y - other.y;
        var l = Math.sqrt(dx * dx + dy * dy);
        if (l < 1e-10) l = 1;

        var tR = 1;
        pos.incX += pos.x + k4 * (edgeLength - l) * dx/l * tR;
        pos.incY += pos.y + k4 * (edgeLength - l) * dy/l * tR;
        pos.incLength += 1;
        var nx = dx/l
        var ny = dy/l

        sx += nx * edgeLength;
        sy += ny * edgeLength;
        count += 1;
      });
      if (neighbors.length === 0) return;
    });

    processIncomingMessages();

    var after = getGraphBBox();

    // fit into the box:
    var sx = 1/after.width;
    var sy = 1/after.height;
    nodes.forEach(function(pos) {
      pos.x = before.minX + (pos.x - after.minX) * sx * before.width;
      pos.y = before.minY + (pos.y - after.minY) * sy * before.width;
    });
    var superAfter = getGraphBBox();
    console.log(before, after, superAfter);
  }

}