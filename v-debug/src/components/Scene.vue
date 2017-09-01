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
const Rect = require('../lib/overlaps/rect');

export default {
  name: 'Scene',
  props: ['model'],
  mounted() {
    this.createScene();
    bus.on('restart-layout', this.createScene, this);
    bus.on('toggle-links', this.toggleLinks, this);
    bus.on('highlight-cluster', this.highlightCluster, this);
    bus.on('show-bounds', this.showBounds, this);
    bus.on('draw-lines', this.drawLines, this);
    bus.on('draw-rectangles', this.drawRectangles, this);
  },
  beforeDestroy() {
    this.destroyScene()
    bus.off('restart-layout', this.createScene, this);
    bus.off('toggle-links', this.toggleLinks, this);
    bus.off('highlight-cluster', this.highlightCluster, this);
    bus.off('show-bounds', this.showBounds, this);
    bus.off('draw-lines', this.drawLines, this);
    bus.off('draw-rectangles', this.drawRectangles, this);
  },
  watch: {
    model(newModel) {
      this.createScene();
    }
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
        this.graphScene.off('point-enter', this.handlePointEnter);
        this.graphScene.off('point-leave', this.handlePointLeave);
        this.graphScene.off('point-click', this.handlePointClick);
        this.graphScene = null;
      }
    },
    drawLines(lines) {
      this.graphScene.drawLines(lines);
    },
    showBounds(cluster) {
      if (!cluster.children) return; // only higher level clusters have bounds.
      let rectangles = [];

      let layout = cluster.layout;
      let ownOffset = cluster.getOwnOffset();
      cluster.children.forEach(child => {
        let pos = layout.getNodePosition(child.id);
        let bbox = child.getBoundingBox();
        rectangles.push(new Rect({
          left: bbox.cx + ownOffset.x + pos.x - bbox.width/2,
          width: bbox.width,
          top: bbox.cy + ownOffset.y + pos.y - bbox.height/2,
          height: bbox.height
        }));
      })
      this.graphScene.showRectangles(rectangles);
    },
    drawRectangles(rectangles, color) {
      this.graphScene.showRectangles(rectangles, false, color);
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
        this.graphScene.on('point-enter', this.handlePointEnter, this);
        this.graphScene.on('point-leave', this.handlePointLeave, this)
        this.graphScene.on('point-click', this.handlePointClick, this);
      }
    },
    highlightCluster(cluster) {
      if (!cluster) {
        // just remove the highlight.
        this.graphScene.highlight(null);
        return;
      }
      let children = cluster.buildNodePositions();
      let offset = cluster.getOwnOffset();
      children.forEach(pos => {
        pos.x += offset.x;
        pos.y += offset.y;
      });
      this.graphScene.highlight(children);
    },
    handlePointClick(node) {
      bus.fire('select-node', node.p.data);
    },

    handlePointEnter(node, coord) {
      this.tooltip.text = node.p.data;
      this.tooltip.show = true;
      this.tooltip.style.left = (coord.x + 20) + 'px';
      this.tooltip.style.top = (coord.y - 20) + 'px';
    },
    handlePointLeave(node, coord) {
      this.tooltip.show = false;
    },
    toggleLinks() {
      this.graphScene.toggleLinks();
    }
  },
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