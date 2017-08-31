<template>
  <div id="app">
    <scene :model='model'></scene>
    <graph-settings :model='model'></graph-settings>
    <dot-window v-if='dotWindowVisible' :content='dotContent' @close='hideDotWindow'></dot-window>
  </div>
</template>

<script>
const Scene = require('./components/Scene');
const DotWindow = require('./components/DotWindow');
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
    GraphSettings,
    DotWindow
  },
  mounted() {
    bus.on('request-split', this.onSplit, this);
    bus.on('show-dot', this.showDot, this);
    bus.on('load-graph', this.loadGraph, this);
  },
  beforeDestroy() {
    bus.off('request-split', this.onSplit);
    bus.off('show-dot', this.showDot);
    bus.off('load-graph', this.loadGraph);
  },

  data() {
    let model = initClusterModel(graph);
    window.c0 = model.root;
    return {
      model,
      dotContent: '',
      dotWindowVisible: false
    }
  },

  methods: {
    loadGraph(graph) {
      let model = initClusterModel(graph);
      window.c0 = model.root;
      this.model = model;
    },
    showDot(dotContent) {
      this.dotContent = dotContent;
      this.dotWindowVisible = true;
    },
    hideDotWindow() {
      this.dotWindowVisible = false;
    },
    onSplit(cluster) {
      if (!cluster.parent) {
        let potentialRoot = cluster.split();
        if (potentialRoot) {
          this.model.root = potentialRoot
          window.c0 = this.model.root;
          this.model.selectedCluster = this.model.root;
        } else {
          console.error('Cannot split anymore - no modularity gain');
        }
      } else {
        let newSplit = cluster.split();
        if (newSplit) {
          let parent = cluster.parent;
          parent.removeChild(cluster);
          parent.appendChild(newSplit);
          this.model.root.reset(true);
          this.model.selectedCluster = newSplit;
        } else {
          console.error('cannot split anymore - no modularity gain');
        }
      }
      bus.fire('restart-layout');
    }
  }
}
</script>

<style>

* { box-sizing: border-box; }
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
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
