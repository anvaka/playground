<template>
  <canvas></canvas>
</template>

<script>
const wgl = require('../lib/wgl/index')

export default {
  name: 'Scene',
  mounted() {
    let canvas = this.$el;

    let nodeCount = 300;
    let scene = wgl.scene(canvas);
    let nodes = new wgl.Points(nodeCount);

    let r = 500;
    let step = 2 * Math.PI/nodeCount;
    for (var i = 0; i < nodeCount; ++i) {
      nodes.add(new wgl.Point(
        /* x = */ r * Math.cos(i * step),
        /* y = */ r * Math.sin(i * step)
      ));
    }

    scene.add(nodes);

    let nodes2 = new wgl.Points(nodeCount);
    nodes2.transform.dx = 0.5;

    for (var i = 0; i < nodeCount; ++i) {
      nodes2.add(new wgl.Point(
        /* x = */ r * Math.cos(i * step),
        /* y = */ r * Math.sin(i * step)
      ));
    }

    scene.add(nodes2);
  }
}
</script>

<style>
  canvas {
    width: 100%;
    height: 100%;
  }
</style>