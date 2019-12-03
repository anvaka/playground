// Source for https://twitter.com/anvaka/status/1091994047286104064 
var graph = require('ngraph.graph')();
var todot = require('ngraph.todot');
var minX = -3, maxX = 3;
var minY = -3, maxY = 3;
 
var cx = minX, cy = minY;
var dx = (maxX - minX) / 300;
var dy = (maxY - minY) / 300;


while (!drawNext()) {}
//console.log(graph.getLinksCount());
 console.log(todot(graph))

function drawNext() {
  var z = {x: cx, y: cy}

  for(var i = 0; i < 32; ++i) {
    if (length(z) > 2) break;
    // main fractal loop. Change it:
    var zn = c_mul(z, z);
    zn.x += cx;
    zn.y += cy;
    if (length(zn) <=2 ) drawLine(z, zn);
    z = zn;
  }
  
  if (cx < maxX) cx += dx;
  else if (cy < maxY) {
    cy += dy;
    cx = minX;
  } else {
    return true; // done.
  }
}
function length(z) {
  return Math.sqrt(z.x * z.x + z.y * z.y);
}

function c_mul(self, other) {
  return {
    x: self.x * other.x - self.y * other.y,
    y: self.x * other.y + self.y * other.x
  };
}

function drawLine(from, to) {
  var fromKey = makeKey(from);
  var toKey = makeKey(to);
  if (graph.hasLink(fromKey, toKey) || graph.hasLink(toKey, fromKey)) return;
  graph.addLink(fromKey, toKey);
}

function makeKey(p) {
  return precision(p.x) + ',' + precision(p.y);
}

function precision(x) {
  return Math.round(x * 10);
}


