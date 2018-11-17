<template>
  <div id="app">
    <form v-on:submit.prevent="onSubmit" class='search-box'>
      <input type="text" v-model='query' placeholder='Search query'>
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

<style lang='stylus'>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  position: absolute;
  top: 8px;
  left: 14px;
}
.search-box {
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2), 0 -1px 0px rgba(0,0,0,0.02);
  height: 48px;
  width: 392px;
  display: flex;

  input {
    flex: 1;
    border: none;
    font-size: 24px;
    margin: 0 18px;

    &:focus {
      outline: none;
    }
  }
}
</style>
