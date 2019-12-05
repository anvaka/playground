document.body.innerHTML = '<canvas id="scene"></canvas>';

var visited = new Map();
var maxIntensity = 15;
var scaleFactor = 1
var canvasWidth = 640*scaleFactor; 
var canvasHeight = 480*scaleFactor;
var precisionValue = 50; 
var minX = -1.1, maxX = 0.1;
var minY = -0.5, maxY = 0.5;
var cx = minX, cy = minY;

var dx = (maxX - minX) / canvasWidth;
var dy = (maxY - minY) / canvasHeight;
var scene = document.getElementById('scene');
var ctx = scene.getContext('2d');
var imageData; 
var maxPointsLength = 1000;
scene.width = ctx.width = canvasWidth; 
scene.height = ctx.height = canvasHeight;

frame();

function frame() {
  beginChange();   
  var done = drawNext();
  commitChange();
  
  if (done) { 
    return;
  } 

//  requestAnimationFrame(frame);
}

function drawNext() {
  let rowNumber = 0; 
  // noprotect
  while (rowNumber < canvasHeight) { 
    for (cx = minX; cx < maxX; cx += dx) {
      var z = {x: cx, y: cy}; 
      for(var i = 0; i < 32; ++i) {
        if (length(z) > 2) break;
        // main fractal loop. Change it:
        var zn = c_mul(z, z);
        zn.x += cx; 
        zn.y += cy;   


        recordPoint(z); 
        z = zn;
      }  
    }
    if (cy < maxY) {
      cy += dy;
    } else {

      return true; // done.
    } 
    rowNumber += 1;
  } 
}

function beginChange() {
  ctx.fillRect(0, 0, canvasWidth, canvasHeight); 
  imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight)
}

function commitChange() {
  visited.forEach(function(pointRecord) {
    var c = Math.round(255 * pointRecord.value / maxIntensity);
    pointRecord.point.forEach(pt => drawPoint(pt, c, c, c));
  }); 
  ctx.putImageData(imageData, 0, 0);
} 

function recordPoint(current) {
  var key = makeKey(current);
  var pointRecord = visited.get(key);
  if (!pointRecord) {
    pointRecord = { 
      point: [current],
      value: 0
    };
  }
  
  pointRecord.value += 1; 
  let exist = pointRecord.point.find(pt => pt.x === current.x && pt.y === current.y);

  if (pointRecord.point.length > maxPointsLength) {
    maxPointsLength = pointRecord.point.length;
    console.log(maxPointsLength);
//     debugger; 
  }
  if (!exist) {
    pointRecord.point.push(current);
  }
  if (pointRecord.value > maxIntensity) {
    maxIntensity = pointRecord.value;
//     console.log(maxIntensity, cy) ;
  } 
  
  visited.set(key, pointRecord);
}

function drawPoint(point, r, g, b) {
  var x = Math.round(canvasWidth * (point.x - minX)/(maxX - minX));
  var y = canvasHeight -  Math.round(canvasHeight * (point.y - minY) / (maxY - minY));
  if (y < 0 || y > canvasHeight) return;
  if (x < 0 || x > canvasWidth) return;  
  
  var index = (x + y * canvasWidth)*4; 
  imageData.data[index] = r;
  imageData.data[index + 1] = g;
  imageData.data[index + 2] = b;
  imageData.data[index + 3] = 255;
}

function makeKey(p) {
  return precision(p.x) + ',' + precision(p.y);
}

function precision(x) {
  return Math.round(x * precisionValue);
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
