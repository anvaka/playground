<template>
  <canvas></canvas>
</template>

<script>
const wgl = require('../lib/wgl/index')

export default {
  name: 'Scene',
  mounted() {
    let canvas = this.$el;

    let nodeCount = 30;
    let scene = wgl.scene(canvas);
    let nodes = new wgl.Points(nodeCount);

    let r = 500;
    let step = 2 * Math.PI/nodeCount;
    let points = [];
    for (var i = 0; i < nodeCount; ++i) {
      let p = new wgl.Point(
        /* x = */ r * Math.cos(i * step),
        /* y = */ r * Math.sin(i * step)
      );

      nodes.add(p);
      points.push(p);
    }

    scene.add(nodes);

    let lines = new wgl.Lines(nodeCount * (nodeCount - 1));

    for (var i = 0; i < nodeCount; ++i) {
      for (var j = (i + 1); j < nodeCount; ++j) {
        lines.add(new wgl.Line(
          points[i],
          points[j]
        ));
      }
    }

    scene.add(lines);
  }
}
</script>

<style>
  canvas {
    width: 100%;
    height: 100%;
  }
</style>