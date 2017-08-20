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