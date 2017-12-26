var fs = require('fs');
var path = require('path');
var PImage = require('pureimage');

// How many iterations of force based layout shall we perform?
var LAYOUT_ITERATIONS = 1500;

// Base file name
var OUT_IMAGE_NAME = path.join('out', (new Date()).toISOString().replace(/:/g, '.'));

// To prevent vector field from influence of outliers, we compute standard deviation
// of vector field values, and clamp any value beyond this many sigmas.
var SIGMA = 3;

// How many pixels shall we reserve for texture edges padding?
var PADDING = 42;

// If set to true, then original graph layout is saved into .layout.png file
var saveOriginalLayout = true;

// If set to true, then layout image will also include Voronoi decomposition.
var saveVoronoi = false;

// If set, then all four color channels are used for vector field encoding.
// Otherwise only g and b channels are set.
var USE_RGBA_ENCODING = true;

// Bytes per velocity component, translated into possible value range
var colorRange = (1 << (USE_RGBA_ENCODING ? 2 : 1) * 8) - 1;

var generators = require('ngraph.generators');
var graph = generators.balancedBinTree(5);
//var graph = require('miserables');

// var graph = require('ngraph.graph')();
// graph.addLink(42, 31);


/**
 * Given a pair of points - return a vector associated with the pair. 
 * I.e. this is the vector field definition
 * 
 * @param {Number} x 
 * @param {Number} y 
 */
function vectorField(x, y) {
  return {
    x: y,
    y:-x * Math.abs(x)
  }
}

/**
 * Your RBF function to mix vector fields. See https://en.wikipedia.org/wiki/Radial_basis_function
 * 
 * @param {Number} r - vector's length
 */
function rbf(r) {
  // return 1./(1 + r * r);
  return Math.exp(-r * r * 0.001);
}

// Main code:
var layout = layoutGraph(graph);
saveLayoutToVectorFieldTexture(layout);

// That's it. Main code is over. Anything beyond is just an implementation.

/**
 * Performs graph layout.
 * 
 * @param {ngraph.graph} graph - graph to be laid out
 */
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

/**
 * Now that we have layout - use it to build composite vector field, and store
 * the final vector field into a texture.
 * 
 * @param {Object} layout - see https://github.com/anvaka/ngraph.forcelayout
 */
function saveLayoutToVectorFieldTexture(layout) {
  var rect = layout.getGraphRect();

  // small padding for aesthetics:
  rect.x2 += PADDING; rect.y2 += PADDING;
  rect.x1 -= PADDING; rect.y1 -= PADDING;

  // Make texture with equal height/width:
  rect.x1 = Math.floor(rect.x1);
  rect.y1 = Math.floor(rect.y1);
  rect.x2 = Math.ceil(rect.x2);
  rect.y2 = Math.ceil(rect.y2);
  var width = rect.x2 - rect.x1;
  var height = rect.y2 - rect.y1;
  if (width > height) {
    rect.y2 = rect.y1 + width;
    height = width;
  } else {
    rect.x2 = rect.x1 + height;
    width = height;
  }

  // Now it's time to go over every single pixel and build a matrix of
  // velocities. I don['t really care about performance here, as this is
  // just an experiment.
  console.log('Collecting velocities...')
  var velocities = accumulateVelocities(rect, layout);

  // Now that we have all velocities, let's encode them into texture:
  console.log('Rendering vector field...')
  var scene = PImage.make(width, height);

  var ctx = scene.getContext('2d');
  var imgData = ctx.getImageData();

  for (var x = 0; x < width; ++x) {
    for (var y = 0; y < height; ++y) {
      var encodedVelocity = encodeVelocity(velocities[x][y]);
      imgData.setPixelRGBA_i(x, y, encodedVelocity.r, encodedVelocity.g, encodedVelocity.b, encodedVelocity.a);
    }
  }

  // Texture is ready. Dump it onto the file system:
  PImage.encodePNGToStream(scene, fs.createWriteStream(OUT_IMAGE_NAME + '.png')).then(()=> {
      console.log('wrote out the png file to ' + OUT_IMAGE_NAME);
      if (saveOriginalLayout) {
        // This is just for debugging purposes.
        return saveGraphLayoutIntoImage(rect, layout);
      }
  }).catch(e => {
      console.log('there was an error writing', e);
  });
}

function saveGraphLayoutIntoImage(rect, layout) {
  var width = rect.x2 - rect.x1;
  var height = rect.y2 - rect.y1;
  var scene = PImage.make(width, height);
  var ctx = scene.getContext('2d');

  clearRectangle(ctx, width, height);
  ctx.fillStyle = 'rgba(0, 200, 230, 1)';
  layout.forEachBody(body => {
    ctx.fillRect(body.pos.x - rect.x1 - 5, body.pos.y - rect.y1 - 5, 10, 10);
  });

  saveVoronoiIfNeeded(ctx, layout, rect);

  var fileName = OUT_IMAGE_NAME + '.layout.png';
  PImage.encodePNGToStream(scene, fs.createWriteStream(fileName)).then(()=> {
      console.log('wrote out the png file to ' + fileName);
  }).catch(e => {
    console.log('failed to save layout image', e);
  });
}

function clearRectangle(ctx, width, height) {
  var imgData = ctx.getImageData();
  for (var x = 0; x < width; ++x) {
    for (var y = 0; y < height; ++y) {
      imgData.setPixelRGBA_i(x, y, 0, 0, 0, 0);
    }
  } 
}

function saveVoronoiIfNeeded(ctx, layout, rect) {
  if (!saveVoronoi) return;

  var width = rect.x2 - rect.x1;
  var height = rect.y2 - rect.y1;

  var voronoi = require('d3-voronoi').voronoi;
  var points = []
  layout.forEachBody(body => {
    points.push({
      x: body.pos.x - rect.x1,
      y: body.pos.y - rect.y1,
    });
  });

  var v = voronoi()
    .x(r => r.x)
    .y(r => r.y)
    .extent([[0, 0], [width, height]]);
  var computed = v(points)

  ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
  computed.polygons().forEach(polygon => {
    polygon.forEach((point, idx, arr) => {
      if (idx === 0) {
        ctx.beginPath()
        ctx.moveTo(point[0], point[1]);
        return;
      }
      ctx.lineTo(point[0], point[1])

      if (idx === arr.length - 1) {
        ctx.stroke();
      }
    })
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

  var meanX = 0, meanY = 0;
  var x, y;
  // collect velocities and bounds
  for (x = 0; x < width; ++x) {
    var yVelocity = [];
    velocity.push(yVelocity);
    for (y = 0; y < height; ++y) {
      var v = getVelocity(x + rect.x1, y + rect.y1, layout);
      yVelocity[y] = v;
      meanX += v.x;
      meanY += v.y;

      if (v.x > maxX) maxX = v.x;
      if (v.x < minX) minX = v.x;
      if (v.y > maxY) maxY = v.y;
      if (v.y < minY) minY = v.y;
    }
  }
  var n = height * width
  meanX /= n;
  meanY /= n;

  var sigmaX = 0, sigmaY = 0;
  for (x = 0; x < width; ++x) {
    for (y = 0; y < height; ++y) {
      var v = velocity[x][y];
      sigmaX += (v.x - meanX) * (v.x - meanX);
      sigmaY += (v.y - meanX) * (v.y - meanX);
    }
  }

  sigmaX = Math.sqrt(sigmaX/(n - 1));
  sigmaY = Math.sqrt(sigmaY/(n - 1));

  console.log(`X: [${minX}, ${maxX}], Y: [${minY}, ${maxY}]; Mean: (${meanX}, ${meanY}); Sigma: (${sigmaX}, ${sigmaY})`);

  // clamp entries:
  minX = meanX - SIGMA * sigmaX; maxX = meanX + SIGMA * sigmaX;
  minY = meanY - SIGMA * sigmaY; maxY = meanY + SIGMA * sigmaY;
  console.log(`Transform min/max: X: [${minX}, ${maxX}], Y: [${minY}, ${maxY}];`);

  velocity.forEach(column => {
    column.forEach(pixelVelocity => {
      pixelVelocity.x = clamp(colorRange * (pixelVelocity.x - minX)/(maxX - minX), 0, colorRange);
      pixelVelocity.y = clamp(colorRange * (pixelVelocity.y - minY)/(maxY - minY), 0, colorRange);
    });
  })

  return velocity;
}

function clamp(x, min, max) {
  if (x < min) return min;
  if (x > max) return max;
  return x;
}

function getVelocity(x, y, layout) {
  var v = {x: 0, y: 0};

  layout.forEachBody(body => {
    var pos = body.pos;
    var px = x - pos.x;
    var py = y - pos.y;
    var d = getLength(px, py);
    if (d < 1e-5) return;

    var vf = vectorField(px, py);
    v.x += vf.x * rbf(d);
    v.y += vf.y * rbf(d);
  });

  return v;
}

function getLength(x, y) {
  return Math.sqrt(x * x + y * y);
}

function encodeVelocity(velocity) {

  if (USE_RGBA_ENCODING) {
    // This is how you decode 4-byte encoding:
    // vec4 c = texture2D(input0, vec2(p.x, 1. - p.y));
    // v.x = (c.r + c.g/255.) - 0.5;
    // v.y = 0.5 - (c.b + c.a/255.);
    var x = Math.floor(velocity.x);
    var y = Math.floor(velocity.y);
    return {
      r: (x & 0xFF00) >> 8, 
      g: (x & 0x00FF),
      b: (y & 0xFF00) >> 8,
      a: (y & 0x00FF),
    }
  } else {
    // This encoding could be restored by something like:

    //  vec4 c = texture2D(input0, vec2(p.x, 1. - p.y));
    //  v.x = c.g - 0.5;
    //  v.y = 0.5 - c.b;
    return {
      g: velocity.x,
      r: 0,
      b: velocity.y,
      a: 255
    }
  }
}