import Vue from 'vue'
import App from './App.vue'
import createScene from './scene';

import * as gen from './generators';
import queryState from 'query-state';

import bus from './bus';

var qs = queryState({
  isAsync: false,
  p0: 50,
  p1: 4,
}, {
  useSearch: true
});

qs.onChange(updateScene);
bus.on('change-qs', (newState) => {
  qs.set(newState);
  updateScene(newState);
})

var sceneOptions = getSceneOptions(qs.get());
var currentScene = createScene(sceneOptions, document.getElementById('scene'));

Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app')

function updateScene(appState) {
  sceneOptions = getSceneOptions(appState);
  if (currentScene) {
    currentScene.dispose();
  }
  currentScene = createScene(sceneOptions, document.getElementById('scene'));
}


function getSceneOptions(state) {
  var generator = state.generator;
  if (!(generator in gen)) {
    generator = 'drunkgrid'
  }
  var p0 = getNumber(state.p0, 50); 
  var p1 = getNumber(state.p1, 4);

  var lines = gen[generator](p0, p1);
  window.lines = lines;
  var isAsync = state.isAsync;
  var stepsPerFrame = getNumber(state.stepsPerFrame, 20);
  return {lines, isAsync, stepsPerFrame}
}

function getNumber(x, defaultValue) {
  var num = Number.parseFloat(x);
  return Number.isFinite(num) ? num : defaultValue;
}