import Vue from 'vue'
import App from './App.vue'
import createScene from './scene';

var createRandom = require('ngraph.random');
var seed = +new Date();
seed = 1536184756878;
var random = createRandom(seed);
console.log('seed', seed)

var lines = generateLines();
var state = {}

createScene(lines, document.getElementById('scene'));

Vue.config.productionTip = false
new Vue({
  render: h => h(App, {
    props: state
  })
}).$mount('#app')


function generateLines() {
  var lines = getCircularLines(10); //
  //lines = getRandomLines(450, 100); // 
  window.lines = lines;

  return lines;
}

function getCircularLines(count = 10, range = 100) {
  // var lines = [
  //   // {start: {x: 0, y: 1}, end: {x: 10, y: 0}},
  //   {start: {x: 10, y: 0}, end: {x: 10, y: 10}},
  //   // {start: {x: 0, y: 9}, end: {x: 10, y: 9}},
  //   // {start: {x: 10, y: 10}, end: {x: 0, y: 10}},
  //   // {start: {x: 0, y: 10}, end: {x: 0, y: 0}},
  //   {start: {x: 10, y: 10}, end: {x: 0, y: 0}},
  //   {start: {x: 0, y: 10}, end: {x: 10, y: 0}}
  // ]
  // return lines;

  var angleStep = Math.PI * 0.5 / count;
  var lines = [];
  var seen = new Set();

  for (var i = 0; i < count; ++i) {
    var angle = 2 * angleStep * i;
    var x = Math.cos(angle) * range / 2;
    var y = Math.sin(angle) * range / 2;
    for (var j = 0; j < count; ++j) {
      if (j !== i) {
        var ex = Math.cos(2 * angleStep * j) * range / 2;
        var ey = Math.sin(2 * angleStep * j) * range / 2;
        var l = {
          name: `${i},${j}`,
          start: {x: x, y: y},
          end: {x: ex, y: ey}
        };
        var sKey = getKey(l);
        if (!seen.has(sKey)) {
          lines.push(l);
          seen.add(sKey)
        }
      }
    }
  }

  return lines;

  function getKey(segment) {
    var sKey = getPointKey(segment.start);
    var eKey = getPointKey(segment.end);
    if (sKey < eKey) {
      var temp = sKey;
      sKey = eKey;
      eKey = temp;
    }
    return sKey + eKey;
  }

  function getPointKey(p) {
    return Math.round(p.x * 1000)/1000 + '' + Math.round(p.y * 1000)/1000;
  }
}

function getRandomLines(count = 4, range = 100) {
  var lines = [];
  for (var i = 0; i < count; ++i) {
    lines.push({
      start: {x: (random.nextDouble() - 0.5) * range, y: (random.nextDouble() - 0.5) * range},
      end: {x: (random.nextDouble() - 0.5) * range, y: (random.nextDouble() - 0.5) * range}
    });
  }
  return lines;
}

function getTiltedTriple() {
  return [
    {
      name: 'a',
      "start": {
        "x": 91.47430695593357,
        "y": 38.30790854990482
      },
      "end": {
        "x": 20.40361762046814,
        "y": -31.45194724202156
      }
    },
    {
      name: 'b',
      "start": {
        "x": 89.07648622989655,
        "y": 4.121243581175804
      },
      "end": {
        "x": 29.378482326865196,
        "y": -26.02245584130287
      }
    },
    {
      name: 'c',
      "start": {
        "x": 9.166541695594788,
        "y": -0.8784450590610504
      },
      "end": {
        "x": 49.26562421023846,
        "y": -42.05264896154404
      }
    }
  ];
}