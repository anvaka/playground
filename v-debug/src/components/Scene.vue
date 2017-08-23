<template>
  <canvas></canvas>
</template>

<script>
const wgl = require('../lib/wgl/index');
const renderGraph = require('../lib/renderGraph');
const bus = require('../lib/bus');

export default {
  name: 'Scene',
  props: ['graph', 'settings'],
  mounted() {
    this.createScene();
    bus.on('restart-layout', this.createScene, this);
    bus.on('clusters-ready', this.showClusters, this);
  },
  methods: {
    destroyScene() {
      if (this.graphScene) {
        this.graphScene.dispose();
        this.graphScene = null;
      }

    },
    createScene() {
      if (this.graphScene) {
        this.destroyScene();
      }

      var graph = this.graph;
      let canvas = this.$el;
      let scene = wgl.scene(canvas);
      let useGraph = true;
      if (useGraph) {
        this.graphScene = renderGraph(graph, scene, this.settings);
        // TODO: I need some notion of "tools". Each tool can be active/inactive.
        // Once tool is active it can participate in canvas events.
        // Tools should fire events, and their UI parts would respond to events.
        // Which means when tools are initialized they need to have "context"
        this.graphScene.on('node-move', (node) => {
          console.log('moving node')
        })
      }
    },
    showClusters(clustersGraph) {
      if (this.graphScene) {
        this.graphScene.showClusters(clustersGraph);
      }
    }
  },
  beforeDestroy() {
    this.destroyScene()
    bus.off('restart-layout', this.createScene, this);
  }
}

</script>

<style>
  canvas {
    width: 100%;
    height: 100%;
  }
</style>