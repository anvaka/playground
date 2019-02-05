var graphJson = require('./graph1.json')
var graph = require('ngraph.fromjson')(graphJson);

var cnv = document.getElementById('cnv');
var ctx = cnv.getContext('2d');
var width = ctx.width = cnv.width = 640;
var height = ctx.height = cnv.height = 640;
var seed = 42;

var backgroundData = ctx.getImageData(0, 0, width, height);
var d = backgroundData.data;

var stops = [
  {rgb: {r: 0x2E, g: 0x2A, b: 0x4D}, t: 0},
  //{rgb: {r: 0x2E, g: 0x2A, b: 0x4D}, t: 1},
  {rgb: parseRGB('#313053'), t: 1.0},
//  {rgb: parseRGB('#74B99D'), t: 1},
]
function parseRGB(str) {
  return {
    r: Number.parseInt(str.substr(1, 2), 16),
    g: Number.parseInt(str.substr(3, 2), 16),
    b: Number.parseInt(str.substr(5, 2), 16),
  }
}

for (var x = 0; x < width; ++x) {
  for (var y = 0; y < height; ++y) {
    var idx = (x + width * y) * 4;
    var t = (height - 1- y)/height;
    var {from, to, it} = getFromTo(t);
    var ic = lerp_rgb(from, to, it);
    var dc = gaussian() > 2 ? Math.round(gaussian() * 12): Math.round(gaussian() * 2);
    ic.r += dc;
    ic.g += dc;
    ic.b += dc; 

    d[idx + 0] = ic.r;
    d[idx + 1] = ic.g;
    d[idx + 2] = ic.b;

    d[idx + 3] = 255;
  }
}

var layout = require('ngraph.forcelayout')(graph, {
  timeStep: 1
});


layout.step();

var graphRect = layout.getGraphRect()

requestAnimationFrame(frame);
function frame() {
  requestAnimationFrame(frame);
  layout.step();
  graphRect = layout.getGraphRect()

  ctx.putImageData(backgroundData, 0, 0);
  ctx.shadowBlur = 0;
  drawGraph();
}

function drawGraph() {
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  //ctx.fillStyle = '#0C0334';
  // ctx.strokeStyle = 'rgba(12, 3, 52, 0.74)';
  ctx.strokeStyle = 'rgba(12, 3, 42, 0.74)';
  graph.forEachLink(function(link) {
    drawLink(layout.getNodePosition(link.fromId), layout.getNodePosition(link.toId));
  });
  ctx.stroke();
  ctx.shadowBlur = 24;
  ctx.shadowColor = "white";
  ctx.fillStyle = "#FDF0A2";
  graph.forEachNode(function(node) {
    let p = toScreen(layout.getNodePosition(node.id));
    circle(ctx, p.x, p.y, 2, false);
  })
  ctx.fill()

  function drawLink(from, to) {
    var screenFrom = toScreen(from);
    var screenTo = toScreen(to);
    ctx.moveTo(screenFrom.x, screenFrom.y)
    ctx.lineTo(screenTo.x, screenTo.y)
  }
}


function toScreen(graphPoint) {
  return {
    x: 0.9 * width * (graphPoint.x - graphRect.x1) / (graphRect.x2 - graphRect.x1) + width * 0.1/2,
    y: 0.9 * height * (graphPoint.y - graphRect.y1) / (graphRect.y2 - graphRect.y1) + height * 0.1/2
  };
}

function circle(ctx, x, y, r, reverse) {
  ctx.moveTo(x+r, y);
  ctx.arc(x, y, r, 0, 2 * Math.PI, !!reverse);
}

function getFromTo(t) {
  var i = 0;
  var from = stops[0];
  while (t >= stops[i].t) {
    from = stops[i];
    i += 1;
  }
  var next = Math.min(stops.length - 1, i);
  var to = stops[next]; 

  return {
    from: from.rgb, 
    to: to.rgb,
    it: (t - from.t)/(to.t - from.t)
  };
}

function lerp_rgb(from, to, t) {
  var r = to.r * t + (1 - t) * from.r;
  var g = to.g * t + (1 - t) * from.g;
  var b = to.b * t + (1 - t) * from.b;
  
  return {r, g, b};
}

function lerp_hsl(from, to, t) {
  var h = to.h * t + (1 - t) * from.h;
  var s = to.s * t + (1 - t) * from.s;
  var l = to.l * t + (1 - t) * from.l;
  
  return {
    h: h, s: s, l: l
  };
}

function rgbToHsl(r, g, b){
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
}



function hslToRgb(h, s, l){
    var r, g, b;

    if(s === 0){
        r = g = b = l; // achromatic
    }else{

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function hue2rgb(p, q, t){
  if(t < 0) t += 1;
  if(t > 1) t -= 1;
  if(t < 1/6) return p + (q - p) * 6 * t;
  if(t < 1/2) return q;
  if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
  return p;
}

function gaussian() {
  // use the polar form of the Box-Muller transform
  // based on https://introcs.cs.princeton.edu/java/23recursion/StdRandom.java
  var r, x, y;
  do {
    x = nextDouble() * 2 - 1;
    y = nextDouble() * 2 - 1;
    r = x * x + y * y;
  } while (r >= 1 || r === 0);

  return x * Math.sqrt(-2 * Math.log(r)/r);
}

function nextDouble() {
  // Robert Jenkins' 32 bit integer hash function.
  seed = ((seed + 0x7ed55d16) + (seed << 12)) & 0xffffffff;
  seed = ((seed ^ 0xc761c23c) ^ (seed >>> 19)) & 0xffffffff;
  seed = ((seed + 0x165667b1) + (seed << 5)) & 0xffffffff;
  seed = ((seed + 0xd3a2646c) ^ (seed << 9)) & 0xffffffff;
  seed = ((seed + 0xfd7046c5) + (seed << 3)) & 0xffffffff;
  seed = ((seed ^ 0xb55a4f09) ^ (seed >>> 16)) & 0xffffffff;
  this.seed = seed;
  return (seed & 0xfffffff) / 0x10000000;
}