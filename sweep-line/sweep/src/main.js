import Vue from 'vue'
import App from './App.vue'
import createScene from './scene';

var random = require('ngraph.random')(42);

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
  var lines = [];
    // lines.push({
    //   name: 'l',
    //   start: {x: -25, y: -50},
    //   end: {x: 25, y: 50},
    // })
    // lines.push({
    //   name: 'j',
    //   start: {x: -50, y: 50},
    //   end: {x: 50, y: -50},
    // })
    // lines.push({
    //   name: 'k',
    //   start: {x: -40, y: 25},
    //   end: {x: 40, y: 15},
    // })

    // lines.push({
    //   start: {x: -50, y: -50},
    //   end: {x: 50, y: 50},
    // })
  var range = 100;
  for (var i = 0; i < 10; ++i) {
    lines.push({
      start: {x: (random.nextDouble() - 0.5) * range, y: (random.nextDouble() - 0.5) * range},
      end: {x: (random.nextDouble() - 0.5) * range, y: (random.nextDouble() - 0.5) * range}
    });
  }
  // lines = [
    
  //   {
  //     name: 'a',
  //     "start": {
  //       "x": 91.47430695593357,
  //       "y": 38.30790854990482
  //     },
  //     "end": {
  //       "x": 20.40361762046814,
  //       "y": -31.45194724202156
  //     }
  //   },
  //   {
  //     name: 'b',
  //     "start": {
  //       "x": 89.07648622989655,
  //       "y": 4.121243581175804
  //     },
  //     "end": {
  //       "x": 29.378482326865196,
  //       "y": -26.02245584130287
  //     }
  //   },
  //   {
  //     name: 'c',
  //     "start": {
  //       "x": 9.166541695594788,
  //       "y": -0.8784450590610504
  //     },
  //     "end": {
  //       "x": 49.26562421023846,
  //       "y": -42.05264896154404
  //     }
  //   }
  // ]
  // console.log(lines);
  window.lines = lines;

  return lines;
}