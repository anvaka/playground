var words = require('./martin_eden.js');
var wordCloud = require('../my-version/index.js');

var svg = require('simplesvg');
var panzoom = require('panzoom');

var scene = document.getElementById('scene');
var renderSvg = true;
var renderCanvas = false;
var renderNotMask = false;
panzoom(scene);

window.setTimeout(start, 1000);
function start() {
var cloud = wordCloud(
 // [[')', 100]],
  words.map(function(x) {
    return [x[0], x[1] + 3]
  }), //.slice(0, 20),
  {
  gridSize: 4,
  weightFactor: 1.42,
  fontFamily: 'Abel, sans-serif',
  maxRotation: Math.PI/2,
  minRotation: Math.PI/2
});

var canvas = document.getElementById('cnv');
var ctx = canvas.getContext('2d');
var mask = cloud.mask;
var width = mask.width;
var height = mask.height;

canvas.setAttribute('width', width);
canvas.setAttribute('height', height);

if (renderNotMask) {
  var occupied = mask.occupied;
  var id = ctx.createImageData(width, height); // only do this once per page
  var d  = id.data;                        // only do this once per page
  for (var y = 0; y < height; ++y) {
    for (var x = 0; x < width; ++x) {
      var idx = y * width + x;
      if (occupied[idx]) {
        var dIdx = idx * 4;
        d[dIdx + 0] = 0;
        d[dIdx + 1] = 255;
        d[dIdx + 2] = 0;
        d[dIdx + 3] = 255;
      }
    }
  }

  ctx.putImageData( id, 0, 0);
}

cloud.on('position', position);

cloud.on('wordclouddrawn', onDrawn);
cloud.on('wordcloudstop', () => this.autoScale = 0);

function position(word) {
  if (renderSvg) {
  var pos = word.transform.translate;

  var text = svg('text', {
    x: pos.x, //word.position.x,
    y: pos.y, //word.position.y,
    //transform: toTransformString(word.transform),
    fill: '#FFFFFF',
    'font-size': word.fontSize + 'px',
    'font-family': word.fontFamily,
    'dominant-baseline': 'text-before-edge'
  });
  text.text(word.text)
  scene.appendChild(text);
  }

  if (renderCanvas) {
    var pos = word.transform.translate;
    //ctx.strokeRect(pos.x,pos.y, word.width,  word.height);
    ctx.fillStyle = 'blue';
    ctx.font = 'normal ' + word.fontSize + 'px ' + word.fontFamily;
    ctx.textBaseline = 'top';
    ctx.fillText(word.text, pos.x, pos.y)
  }
}
}



function toTransformString(transform) {
  return 'scale(' + transform.scale + ',' + transform.scale + ') translate(' + transform.translate.x + ',' + transform.translate.y + ') rotate(' + transform.rotate + ')';
}

function onDrawn(drawn, item) {
    append(drawn, item[0]);
}

function append(record, word) {
  var rotateDeg = record.rotate * 180/Math.PI;
  var text = svg('text', {
    x: record.x,
    y: record.y,
    transform: 'scale(' + record.scale + ',' + record.scale + ') translate(' + record.translate.x + ',' + record.translate.y + ') rotate(' + rotateDeg + ')',
    fill: record.color,
    'font-size': record.fontSize + 'px',
    'font-family': record.fontFamily,
  });
  text.text(word)
  scene.appendChild(text);

}
