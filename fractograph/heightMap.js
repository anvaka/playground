var visited = new Map();
var maxIntensity = 15;
var scaleFactor = 1
var canvasWidth = 512*scaleFactor; 
var canvasHeight = 512*scaleFactor;
var intencities = [];
var aspectRatio = canvasWidth/canvasHeight;
var minX = -2, maxX = 1;
var renderWidth = maxX - minX;
var renderHeight = renderWidth / aspectRatio;

var minY = -1.1, maxY = minX + renderHeight;
var cx = minX, cy = minY;

var dx = (maxX - minX) / canvasWidth;
var dy = (maxY - minY) / canvasHeight;
var precisionValue = 1/(1.*dx); 
var scene = document.getElementById('scene');
var ctx = scene.getContext('2d');
var imageData; 
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

 requestAnimationFrame(frame);
}

function drawNext() {
  let rowNumber = 0; 
  while (rowNumber < 2) { 
    for (cx = minX; cx < maxX; cx += dx) {
      var z = {x: cx, y: cy}; 
      for(var i = 0; i < 32; ++i) {
        if (length(z) > 2) break;
        // main fractal loop. Change it:
        var zn = c_mul(z, z);
        zn.x += cx; 
        zn.y += cy;   


        recordPoint({
          x: z.x,
          y: z.y
        }); 
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
  intencities.forEach((key, index) => {
    var record = visited.get(key);
    if (!record) return;
    var c = Math.round(255 * record.value / maxIntensity);
    var x = index % canvasWidth;
    var y = Math.floor(index / canvasWidth);
    drawPoint(x, y, c, c, c);
  });
  ctx.putImageData(imageData, 0, 0);
} 

function recordPoint(current) {
  var x = Math.round(canvasWidth * (current.x - minX)/(maxX - minX));
  var y = canvasHeight -  Math.round(canvasHeight * (current.y - minY) / (maxY - minY));
  if (y < 0 || y > canvasHeight) return;
  if (x < 0 || x > canvasWidth) return;  

  var key = makeKey(current);
  var pointRecord = visited.get(key);
  if (!pointRecord) {
    pointRecord = { value: 0 };
  }

  pointRecord.value += 1; 
  intencities[x + y * canvasWidth] = key;

  if (pointRecord.value > maxIntensity) {
    maxIntensity = pointRecord.value;
  } 
  
  visited.set(key, pointRecord);
}

function drawPoint(x, y, r, g, b) {
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