import Vue from 'vue'
import App from './App.vue'
import createScene from './scene';
import findIntersections from './findIntersections';

var createRandom = require('ngraph.random');
var seed = +new Date();
seed = 1536687392180
var random = createRandom(seed);
// console.log('seed', seed)

var lines = generateLines();
var state = {}

// var i = 0;
// seed = +new Date();
// while (i < 100000) {
//   seed += 1; 
//   random = createRandom(seed);
//   try {
//     lines = getRandomLines(21, 5);
//     findIntersections(lines);
//   } catch(e) {
//     debugger;
//     console.log('seed: ', seed);
//     i = 100000 + 1;
//   }
//   ++i;
// }
// console.log('all ok')

createScene(lines, document.getElementById('scene'));

Vue.config.productionTip = false
new Vue({
  render: h => h(App, {
    props: state
  })
}).$mount('#app')


function generateLines() {
 var lines = getCircularLines(35, 40);
// var lines = getStarLines(80, 30);
 //var lines = getRandomLines(100, 100); // 
 //var lines = require('./hugeCollection.json')
 window.lines = lines;

  return lines;
}

function getStarLines(count, length) {
  // var lines = [];

  // var lines = [
  //   {start: {x: 1, y: 1}, end: {x: -1, y: -1}, name: 'a1'},
  //   {start: {x: 1, y: 1}, end: {x: -3, y: -3}, name: 'a1'},
  //   {start: {x: -3, y: 0}, end: {x: 3, y: 0.4}, name: 'a1'},
  // ]
  // return lines;

  // var da = (Math.PI/6)/count;
  // var startFrom = -Math.PI/2 - da * count/2;

  // for (var i = 1; i < count; ++i) {
  //   var start = {x: 0, y: 0};
  //   var a = startFrom + i * da;
  //   var end = {
  //     x: length * Math.cos(a),
  //     y: length * Math.sin(a)
  //   };
  //   lines.push({start, end});
  // }
  // lines.push({start: {x: -1000, y: -length/2}, end: {x: 1000, y: -length/2}})
  // lines = lines.concat(getRandomLines(40, 100));
  return lines;
}

function getCircularLines(count = 10, range = 100) {
  // var lines = [
  //   {start: {x: 10.607, y: 10.607}, end: {x: -15, y: 0}, name: 'a1'},
  //   {start: {x: 0, y: 15}, end: {x: 10.607, y: -10.607}, name: 'a0'},
  //   {start: {x: -5, y: 6}, end: {x: -5, y: 7.5}, name: 'b'},
  //   {start: {x: 10, y: -15}, end: {x: 10, y: 14}, name: 'c'},
  // ]
  // return lines;

  var angleStep = 2*Math.PI / count;
  var lines = [];
  var seen = new Set();

  for (var i = 0; i < count; ++i) {
    var angle = angleStep * i;
    var x = Math.cos(angle) * range / 2;
    var y = Math.sin(angle) * range / 2;
    for (var j = 0; j < count; ++j) {
      if (j !== i) {
        var ex = Math.cos(angleStep * j) * range / 2;
        var ey = Math.sin(angleStep * j) * range / 2;
        var name = `${i},${j}`;
        var l = {
          name: name,
          start: {x: x, y: y},
          end: {x: ex, y: ey}
        };
        var sKey = getKey(i, j);
        if (!seen.has(sKey)) {//  && (name == '2,5' || name=='4,5')) {
          lines.push(l);
          seen.add(sKey)
        }
      }
    }
  }

  return lines;

  function getKey(i, j) {
    return i < j ? i + ';' + j : j + ';' + i;
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