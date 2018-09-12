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
 var lines = getCircularLines(10, 50);
//  lines = [
//   {
//     name: 'a',
//     "start": {
//       "x": -1.3279102370142937,
//       "y": 0.6754067912697792
//     },
//     "end": {
//       "x": -2.257566899061203,
//       "y": -2.65141598880291
//     }
//   },
//   {
//     name: 'c',
//     "start": {
//       "x": 1.2514698877930641,
//       "y": 3.774871490895748
//     },
//     "end": {
//       "x": -3.551577106118202,
//       "y": -3.361998274922371
//     }
//   },
//   {
//     name: 'd',
//     "start": {
//       "x": -0.9909890964627266,
//       "y": 1.927625648677349
//     },
//     "end": {
//       "x": -1.3501517847180367,
//       "y": 0.2368326112627983
//     }
//   },
//   {
//     name: 'f',
//     "start": {
//       "x": 0.8007890731096268,
//       "y": 3.2876522094011307
//     },
//     "end": {
//       "x": -4.0684183314442635,
//       "y": -2.3970097675919533
//     }
//   }
// ]
//  lines = [
//   {
//     name: 'a',
//     "start": {
//       "x": -1.3279102370142937,
//       "y": 0.6754067912697792
//     },
//     "end": {
//       "x": -2.257566899061203,
//       "y": -2.65141598880291
//     }
//   },
//   {
//     name: 'b',
//     "start": {
//       "x": 0.33048462122678757,
//       "y": -1.1374526843428612
//     },
//     "end": {
//       "x": -3.272508643567562,
//       "y": -3.544159308075905
//     }
//   },
//   {
//     name: 'c',
//     "start": {
//       "x": 1.2514698877930641,
//       "y": 3.774871490895748
//     },
//     "end": {
//       "x": -3.551577106118202,
//       "y": -3.361998274922371
//     }
//   },
//   {
//     name: 'd',
//     "start": {
//       "x": -0.9909890964627266,
//       "y": 1.927625648677349
//     },
//     "end": {
//       "x": -1.3501517847180367,
//       "y": 0.2368326112627983
//     }
//   },
//   {
//     name: 'e',
//     "start": {
//       "x": 1.485574096441269,
//       "y": -1.0715825855731964
//     },
//     "end": {
//       "x": -4.127512313425541,
//       "y": -2.9448340833187103
//     }
//   },
//   {
//     name: 'f',
//     "start": {
//       "x": 0.8007890731096268,
//       "y": 3.2876522094011307
//     },
//     "end": {
//       "x": -4.0684183314442635,
//       "y": -2.3970097675919533
//     }
//   }
// ]
// var lines = getRandomLines(500, 100); // 
  // var lines = require('./hugeCollection.json')
  window.lines = lines;

  return lines;
}

function getCircularLines(count = 10, range = 100) {
  // var lines = [
  //   {start: {x: 0, y: 50}, end: {x: 0, y: -50}, name: 'a'},
  //   {start: {x: 0, y: 0}, end: {x: 50, y: 0}, name: 'c'},
  //   {start: {x: 0, y: 50}, end: {x: 50, y: 0}, name: 'b'},
  //   {start: {x: 0, y: -50}, end: {x: 50, y: 0}, name: 'd'},
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
        if (name === '2,5') debugger;
        if (Math.abs(ey - y) < 0.001) {
          ey += 0.1;
          y -= 0.1;
        }
        var l = {
          name: name,
          start: {x: x, y: y},
          end: {x: ex, y: ey}
        };
        var sKey = getKey(i, j);
        if (!seen.has(sKey)) {
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