import Vue from 'vue'
import App from './App.vue'
import panzoom from 'panzoom';
import './lib/vue-clap'
Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app')

let scene = document.getElementById('scene');
panzoom(scene, {
  autocenter: true
});
requestAnimationFrame(() => {
  document.querySelector('svg').style.visibility = 'inherit';
})
