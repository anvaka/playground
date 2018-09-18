import Vue from 'vue'
import App from './App.vue'
import createScene from './scene';

import * as gen from './generators';
import queryState from 'query-state';

var qs = queryState({
  isAsync: false,
  p0: 100,
  p1: 40
});

qs.onChange(updateScene);

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
    generator = 'getRandomLines'
  }
  var p0 = getNumber(state.p0, 100); 
  var p1 = getNumber(state.p1, 40);

  var lines = gen[generator](p0, p1);
  var isAsync = state.isAsync;
  return {lines, isAsync}
}

function getNumber(x, defaultValue) {
  var num = Number.parseInt(x, 10);
  return Number.isFinite(num) ? num : defaultValue;
}