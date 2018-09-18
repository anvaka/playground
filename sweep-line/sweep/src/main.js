import Vue from 'vue'
import App from './App.vue'
import createScene from './scene';
import {getCircularLines, getRandomLines, getGridLines} from './generators';
import findIntersections from './findIntersections';

// console.log('seed', seed)

//var lines = require('./smallerCollection.json')
var lines = getCircularLines(12, 40); // 
var state = {}

// var i = 0;
// while (i < 100000) {
//   try {
//     lines = getRandomLines(21, 5);
//     findIntersections(lines);
//   } catch(e) {
//     debugger;
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
