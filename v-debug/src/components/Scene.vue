<template>
<div class='scene-container'>
  <canvas ref='canvas'></canvas>
  <div v-if='tooltip.show' class='tooltip' :style="tooltip.style">{{tooltip.text}}</div>
</div>
</template>

<script>
const wgl = require('../lib/wgl/index');
const renderGraph = require('../lib/renderGraph');
const bus = require('../lib/bus');

export default {
  name: 'Scene',
  props: ['model'],
  mounted() {
    this.createScene();
    bus.on('restart-layout', this.createScene, this);
    bus.on('show-links', this.showLinks, this);
  },
  data() {
    return {
      tooltip: {
        show: false,
        text: '',
        style: { left: 0, top: 0 }
      }
    }
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
      let canvas = this.$refs.canvas;
      let useGraph = true;
      if (useGraph) {
        this.graphScene = renderGraph(this.model, canvas);

        // TODO: I need some notion of "tools". Each tool can be active/inactive.
        // Once tool is active it can participate in canvas events.
        // Tools should fire events, and their UI parts would respond to events.
        // Which means when tools are initialized they need to have "context"
        this.graphScene.on('point-enter', (node, coord) => {
          this.tooltip.text = node.p.data;
          this.tooltip.show = true;
          this.tooltip.style.left = (coord.x + 20) + 'px';
          this.tooltip.style.top = (coord.y - 20) + 'px';
        });
        this.graphScene.on('point-leave', (node, coord) => {
          this.tooltip.show = false;
        })
      }
    },
    showLinks() {
      this.graphScene.showLinks();
    }
  },
  beforeDestroy() {
    this.destroyScene()
    bus.off('restart-layout', this.createScene, this);
    bus.off('show-links', this.showLinks, this);
  }
}
</script>

<style>
  .scene-container, canvas {
    width: 100%;
    height: 100%;
    position: absolute;
  }
  .tooltip {
    position: absolute;
    background: rgba(255, 255, 255, 0.8);
    padding: 5px;
    border-radius: 2px;
    pointer-events: none;
  }
</style>