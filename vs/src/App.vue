<template>
  <div id="app">
    <form v-on:submit.prevent="onSubmit">
      <input type="text" v-model='query'>
    </form>
  </div>
</template>

<script>
import appState, {performSearch} from './appState.js';
import createRenderer from './lib/createRenderer';

export default {
  name: 'App',
  data() {
    return appState;
  },
  methods: {
    onSubmit() {
      let graph = performSearch(appState.query)
      this.renderer.render(graph);
    }
  },
  mounted() {
    this.renderer = createRenderer();
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  position: absolute;
  top: 0;
  left: 0;
}
</style>
