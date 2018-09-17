import Vue from 'vue'
import App from './App.vue'
import createScene from './scene';
import {getCircularLines} from './generators';
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
 var lines = getCircularLines(15, 40);
 //var lines = getRandomLines(10, 100); // 
 //var lines = require('./hugeCollection.json')
 window.lines = lines;

  return lines;
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