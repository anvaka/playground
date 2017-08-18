<template>
  <canvas></canvas>
</template>

<script>
const wgl = require('../lib/wgl/index');
const makeLayout = require('ngraph.forcelayout');

export default {
  name: 'Scene',
  props: ['graph'],
  mounted() {
    var graph = this.graph;
    var layout = makeLayout(graph);
    for (var i = 0; i < 100; ++i) {
      layout.step();
    }
    let canvas = this.$el;

    let nodeCount = graph.getNodesCount();
    let scene = wgl.scene(canvas);
    let nodes = new wgl.Points(nodeCount);
    graph.forEachNode(node => {
      var node = layout.getNodePosition(node.id);
      nodes.add(node)
    })

    scene.add(nodes);

    let lines = new wgl.Lines(graph.getLinksCount());
    lines.color.a = 0.1

    graph.forEachLink(link => {
      var fromPos = layout.getNodePosition(link.fromId);
      var toPos = layout.getNodePosition(link.toId);
      lines.add(new wgl.Line(fromPos, toPos));
    })
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