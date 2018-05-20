<template>
  <div id="app">
    <div v-if='currentState === "loading"'>
      Loading...
    </div>
    <div v-if='currentState === "choose"'>
      <h4>Step 1: Select a boundary</h4>
      <ul>
        <li v-for="item in chooseFrom">
          <a href='#' @click.prevent='highlightBounds(item)'>{{item.name}}</a>
        </li>
      </ul>
    </div>
    <div v-if='selected'>
      <h4>Step 2: Download roads</h4>
      <a href="#" @click.prevent='downloadRoads(selected)'>Build roads for {{selected.name}}</a>
    </div>
    
  </div>
</template>

<script>
import appState from './appState';
import bus from './bus';

export default {
  name: 'App',
  data() {
    return appState;
  },
  components: {
  },
  methods: {
    highlightBounds(item) {
      appState.selected = item;
      bus.fire('highlight-bounds', item.el);
    },
    downloadRoads(item) {
      bus.fire('download-roads', item.el);
    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  width: 400px;
  background: white;
}
</style>
