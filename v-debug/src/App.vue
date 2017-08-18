<template>
  <div id="app">
    <scene :graph='graph'></scene>
  </div>
</template>

<script>
const Scene = require('./components/Scene');
const getGraph = require('./lib/getGraph.js');

const graph = getGraph();
console.log('Graph loaded. Links count: ' + graph.getLinksCount() + '; nodes count: ' + graph.getNodesCount());

export default {
  name: 'app',
  components: {
    Scene
  },
  data() {
    return {
      graph: graph
    }
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
  background: RGB(243, 241, 237);
  position: absolute;
  width: 100%;
  height: 100%;
}
svg {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}
body {
  overflow: hidden;
  padding: 0;
  margin: 0;
}
.actions {
  position: absolute;
  bottom: 0;
  left: 0;
}
canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
