var fs = require('fs');
var path = require('path');
var PImage = require('pureimage');

var LAYOUT_ITERATIONS = 500;
var OUT_IMAGE_NAME = path.join('out', (new Date()).toISOString().replace(/:/g, '.'));

 var graph = require('miserables');
// var graph = require('ngraph.graph')();
// graph.addLink(42, 31);
var layout = layoutGraph(graph);

saveLayoutToVectorField(layout);

function layoutGraph(graph) {
  console.log('running layout...')

  var layout = require('ngraph.forcelayout')(graph, {
    springLength : 35,
    springCoeff : 0.00055,
    dragCoeff : 0.09,
    gravity : -1
  });
  for(var i = 0; i < LAYOUT_ITERATIONS; ++i) layout.step();

  return layout;
}

function saveLayoutToVectorField(layout) {
  var rect = layout.getGraphRect();
  rect.x2 += 10; rect.y2 += 10;
  rect.x1 -= 10; rect.y1 -= 10;
  var width = rect.x2 - rect.x1;
  var height = rect.y2 - rect.y1;
  var scene = PImage.make(width, height);

  console.log('rendering vector field...')

  var ctx = scene.getContext('2d');
  var imgData = ctx.getImageData();

  var velocities = accumulateVelocities(rect, layout);

  for (var x = 0; x < width; ++x) {
    for (var y = 0; y < height; ++y) {
      var encodedVelocity = encodeVelocity(velocities[x][y]);
      imgData.setPixelRGBA_i(x, y, encodedVelocity.r, encodedVelocity.g, encodedVelocity.b, encodedVelocity.a);
    }
  }


  PImage.encodePNGToStream(scene, fs.createWriteStream(OUT_IMAGE_NAME + '.png')).then(()=> {
      console.log('wrote out the png file to ' + OUT_IMAGE_NAME);
      return saveLayoutImage(rect, layout);
  }).catch(e => {
      console.log('there was an error writing', e);
  });
}

function saveLayoutImage(rect, layout) {
  var width = rect.x2 - rect.x1;
  var height = rect.y2 - rect.y1;
  var scene = PImage.make(width, height);
  var ctx = scene.getContext('2d');
  ctx.fillStyle = 'rgba(0, 200, 230, 1)';

  layout.forEachBody(body => {
    ctx.fillRect(body.pos.x - rect.x1 - 5, body.pos.y - rect.y1 - 5, 10, 10);
  });

  var fileName = OUT_IMAGE_NAME + '.layout.png';
  PImage.encodePNGToStream(scene, fs.createWriteStream(fileName)).then(()=> {
      console.log('wrote out the png file to ' + fileName);
  }).catch(e => {
    console.log('failed to save layout image', e);
  });
}

function accumulateVelocities(rect, layout) {
  var velocity = [];
  var width = rect.x2 - rect.x1;
  var height = rect.y2 - rect.y1;

  var minX = Number.POSITIVE_INFINITY;
  var maxX = Number.NEGATIVE_INFINITY;
  var maxY = Number.NEGATIVE_INFINITY;
  var minY = Number.POSITIVE_INFINITY;

  // collect velocities and bounds
  for (var x = 0; x < width; ++x) {
    var yVelocity = [];
    velocity.push(yVelocity);
    for (var y = 0; y < height; ++y) {
      var v = getVelocity(x + rect.x1, y + rect.y1, layout);
      yVelocity[y] = v;
      if (v.x > maxX) maxX = v.x;
      if (v.x < minX) minX = v.x;
      if (v.y > maxY) maxY = v.y;
      if (v.y < minY) minY = v.y;
    }
  }

  // normalize entries:
  velocity.forEach(column => {
    column.forEach(pixelVelocity => {
      pixelVelocity.x = (pixelVelocity.x - minX)/(maxX - minX);
      pixelVelocity.y = (pixelVelocity.y - minY)/(maxY - minY);
    });
  })

  // for (var x = 0; x < width; ++x) {
  //   for (var y = 0; y < height; ++y) {
  //     if (x < width/2) velocity[x][y] = {x: 0.5, y: 0};
  //     else velocity[x][y] = {x: 0.5, y: 1};
  //   }
  // }
  return velocity;
}

function getVelocity(x, y, layout) {
  var v = {x: 0, y: 0};

  layout.forEachBody(body => {
    var pos = body.pos;
    var px = x - pos.x;
    var py = y - pos.y;
    var d = getLength(px, py);
    if (d < 1e-5) return;

    v.x += (py)/(d*d);
    v.y += (px)/(d*d);
  });

  return v;
}

function getLength(x, y) {
  return Math.sqrt(x * x + y * y);
}

function encodeVelocity(normalizedVelocity) {
  var x = Math.floor(normalizedVelocity.x * 0xffff);
  var y = Math.floor(normalizedVelocity.y * 0xffff);

  return {
    r: (x & 0xFF00) >> 8, 
    g: (x & 0x00FF),
    b: (y & 0xFF00) >> 8,
    a: (y & 0x00FF),
  }
}