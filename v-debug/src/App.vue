<template>
  <div id="app">
    <scene :model='model'></scene>
    <graph-settings :model='model'></graph-settings>
  </div>
</template>

<script>
const Scene = require('./components/Scene');
const GraphSettings = require('./components/GraphSettings');
const getGraph = require('./lib/getGraph.js');
const initClusterModel = require('./lib/clusterModel.js');
const bus = require('./lib/bus');

const graph = getGraph();
console.log('Graph loaded. Links count: ' + graph.getLinksCount() + '; nodes count: ' + graph.getNodesCount());

export default {
  name: 'app',
  components: {
    Scene,
    GraphSettings
  },
  mounted() {
    bus.on('request-split', this.onSplit, this);
  },
  beforeDestroy() {
    bus.off('request-split', this.onSplit);
  },

  data() {
    let model = initClusterModel(graph);

    window.c0 = model.root;
    return {
      model,
    }
  },
  methods: {
    onSplit(cluster) {
      if (!cluster.parent) {
        this.model.root = cluster.split();
        window.c0 = this.model.root;
        bus.fire('restart-layout');
      }
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
