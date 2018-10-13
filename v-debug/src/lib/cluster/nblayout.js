import getFloatOrDefault from '../getFloatOrDefault';
import BBox from '../geom/BBox';

export default function nbLayout(graph, settings) {
  const random = require('ngraph.random').random(42)
  var api = {
    getNodePosition,
    step,
    setNodePosition
  };

  var k1 = getFloatOrDefault(settings.k1, 0.5);
  var k2 = getFloatOrDefault(settings.k2, 0.6);
  var k3 = getFloatOrDefault(settings.k3, 0.06);
  var edgeLength = getFloatOrDefault(settings.edgeLength, 100);

  var nodes = new Map();
  initLayout();
  
  return api;

  function initLayout() {
    graph.forEachNode(function(node) {
      nodes.set(node.id, {
        x: (random.nextDouble() - 0.0) * 300,
        y: (random.nextDouble() - 0.0) * 300,
        incX: 0,
        incY: 0,
        incLength: 0
      })
    })
  }

  function getNodePosition(nodeId) {
    var p = nodes.get(nodeId);
    return {
      x: p.x,
      y: p.y
    }
  }

  function setNodePosition(nodeId, x, y) {
    return;
    var pos = nodes.get(nodeId);
    pos.x = x;
    pos.y = y;
  }

  function step() {
    //rescale();
    minimizeEdgeCrossings();
    minimizeEdgeLengthDifference();
    maximizeAngularResolution();
    ensurePositions();
  }

  function rescale() {
    var desiredWidth = 300;
    var desiredHeight = 300;
    var bbox = new BBox();
    graph.forEachLink(function(link) {
      var currentPos = nodes.get(link.fromId);
      bbox.addPoint(currentPos.x, currentPos.y);
      var otherPos = nodes.get(link.toId);
      bbox.addPoint(otherPos.x, otherPos.y);
    });

    var width = bbox.width;
    var height = bbox.height;
    graph.forEachLink(function(link) {
      var currentPos = nodes.get(link.fromId);
      currentPos.x = ((currentPos.x - bbox.left)/width - 0.0) * desiredWidth
      currentPos.y = ((currentPos.y - bbox.top)/height - 0.0) * desiredHeight
      var otherPos = nodes.get(link.toId);
      otherPos.x = ((otherPos.x - bbox.left)/width - 0.0) * desiredWidth
      otherPos.y = ((otherPos.y - bbox.top)/height - 0.0) * desiredHeight
    });
  }

  function ensurePositions() {
    nodes.forEach((p, key) => {
      if (Number.isFinite(p.x) && Number.isFinite(p.y)) return;
       throw new Error('ugh' + key)
    })
  }

  function processIncomingMessages() {
    nodes.forEach(function(pos, key) {
      // if (key === 'a') {
      //   console.log(key, pos.x, pos.y)
      // }
      pos.x = (pos.incX + pos.x)/(pos.incLength + 1);
      pos.y = (pos.incY + pos.y)/(pos.incLength + 1);
      // if (key === 'a') {
      //   console.log(key, pos.x, pos.y)
      // }
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
    })
    processIncomingMessages();
  }

  function minimizeEdgeLengthDifference() {
    var desLength = 0;
    graph.forEachLink(function(link) {
      var currentPos = nodes.get(link.fromId);
      var otherPos = nodes.get(link.toId);
      var dx = otherPos.x - currentPos.x;
      var dy = otherPos.y - currentPos.y;
      if (!Number.isFinite(dx + dy)) debugger;
      var l = Math.sqrt(dx * dx + dy * dy);
      if (l > desLength) desLength = l;
    });
    desLength = Math.max(edgeLength * 0.4, Math.min(desLength, edgeLength));
    console.log(desLength)
    //desLength = edgeLength;

    graph.forEachLink(function(link) {
      var currentPos = nodes.get(link.fromId);
      var otherPos = nodes.get(link.toId);
      var dx = otherPos.x - currentPos.x;
      var dy = otherPos.y - currentPos.y;
      var l = Math.sqrt(dx * dx + dy * dy);
      var ddx, ddy;
      while (l < 1e-10) {
        dx = (random.nextDouble() - 0.5);
        dx = (random.nextDouble() - 0.5);
        l = Math.sqrt(dx * dx + dy * dy);
      }

      ddx = k2 * (desLength - l) * dx/l;
      ddy = k2 * (desLength - l) * dy/l;
      otherPos.incX += otherPos.x + ddx;
      otherPos.incY += otherPos.y + ddy;
      otherPos.incLength += 1;

      currentPos.incX += currentPos.x - ddx;
      currentPos.incY += currentPos.y - ddy;
      currentPos.incLength += 1;
    });

    processIncomingMessages();
  }

  function maximizeAngularResolution() {
    var id = 0;
    graph.forEachNode(function(node) {
      var currentPos = nodes.get(node.id);
      var neighbors = [];
      id += 1;
      graph.forEachLinkedNode(node.id, function(other) {
        var otherPos = nodes.get(other.id);
        var dx = otherPos.x - currentPos.x;
        var dy = otherPos.y - currentPos.y;
        var angle = Math.atan2(dy, dx) + Math.PI;
        neighbors.push({
          pos: otherPos,
          angle 
        });
      });
      if (neighbors.length < 2) return;
      if (node.ascending === undefined) {
        node.ascending = Math.random() < 0.5;
      }
      var ascending = Math.random() > 0.50; // node.ascending; //1;//Math.random() > 0.50;
      //ascending = true;

      // if (ascending) 
      // {
       neighbors.sort((a, b) => a.angle - b.angle);
      // }
      // else 
      // {
      //   neighbors.sort((a, b) => b.angle - a.angle);
      // }

      var dangle = 2 * Math.PI / neighbors.length;

      if (ascending) {
        for (var i = 0; i < neighbors.length; ++i) {
          var curr = neighbors[i];
          var next, curAngle;
          if (i === neighbors.length - 1) {
            next = neighbors[0]; 
            curAngle = 2 * Math.PI - curr.angle + next.angle; 
          } else {
            next = neighbors[i + 1];
            curAngle = next.angle - curr.angle;
          }

          if(Math.abs(curAngle) < dangle) continue;

          var otherPos = curr.pos;
          var newAngle = k3 * (curAngle - dangle)
          var rPoint = rotate(currentPos, otherPos, newAngle);
          otherPos.incX += rPoint.x;
          otherPos.incY += rPoint.y;
          otherPos.incLength += 1;
        }
      } else {
        for (var i = neighbors.length - 1; i >= 0; --i) {
          var curr = neighbors[i];
          var next, curAngle;
          if (i === 0) {
            next = neighbors[neighbors.length - 1]; 
            curAngle = curr.angle + 2 * Math.PI - next.angle; 
          } else {
            next = neighbors[i - 1];
            curAngle = curr.angle - next.angle;
          }

          if (curAngle < dangle) continue;

          var otherPos = curr.pos;
          var newAngle = k3 * (-curAngle + dangle)
          var rPoint = rotate(currentPos, otherPos, newAngle);
          otherPos.incX += rPoint.x;
          otherPos.incY += rPoint.y;
          otherPos.incLength += 1;
        }
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
}