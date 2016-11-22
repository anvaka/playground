var words = require('./words.js');
var wordCloud = require('../index.js');

var svg = require('simplesvg');
var panzoom = require('panzoom');
var scene = document.getElementById('scene');
panzoom(scene);

var cloud = wordCloud(words, {
  gridSize: 4,
  weightFactor: 1.42,
  fontFamily: 'Helvetica, sans-serif',
  maxRotation: Math.PI/2,
  minRotation: Math.PI/2
});

cloud.on('wordclouddrawn', onDrawn);
cloud.on('wordcloudstop', () => this.autoScale = 0);

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
  if (self.autoScale > 0) {
    self.autoScale -= 1;
    self.adjustScale(scene);
  }
}
