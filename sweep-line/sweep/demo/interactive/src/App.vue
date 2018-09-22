<template>
  <div id="app">
    <div>
      <a href='#' @click.prevent='generateNew()' class='action'>Generate New Demo</a>
    </div>
    <div v-if='showMetrics'>
      <div><strong>{{linesCount}}</strong> lines. Found <strong>{{found}}</strong> intersections in <strong>{{elapsed}}</strong></div>
    </div>
    <div class='error' v-if='error'>
      Rounding error detected.
    </div>
  </div>
</template>

<script>
import appState from './appStatus.js';
import generateRandomExample from './generateRandomExample';
import bus from './bus';

export default {
  name: 'app',
  props: ['state'],
  data() {
    return appState;
  },
  methods: {
    generateNew() {
      var newState = generateRandomExample();
      bus.fire('change-qs', newState);
    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 400px;
  position: absolute;
  color: white;
}
a.action {
  color: #fff;
  font-size: 16px;
  padding: 8px;
  flex: 1;
  border: 1px solid #99c5f1;
  justify-content: center;
  align-items: center;
  display: flex;
}

a {
  text-decoration: none;
}
</style>
