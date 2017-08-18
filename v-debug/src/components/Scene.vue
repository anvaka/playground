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
    let canvas = this.$el;
    let scene = wgl.scene(canvas);
    let useGraph = true;
    if (useGraph) {
      renderGraph(graph, scene);
    }
  }
}

function renderGraph(graph, scene) {
    var layout = makeLayout(graph);
    let nodeCount = graph.getNodesCount();
    let nodes = new wgl.Points(nodeCount);
    let nodeIdToUI = new Map();
    let linkIdToUI = new Map();

    graph.forEachNode(node => {
      var point = layout.getNodePosition(node.id);
      var ui = nodes.add(point)
      nodeIdToUI.set(node.id, ui)
    })

    scene.showRectangle({
      left: -1000,
      top: -1000,
      right: 1000,
      bottom:1000,
    })
    scene.add(nodes);

    let lines = new wgl.Lines(graph.getLinksCount());

    graph.forEachLink(link => {
      var fromPos = layout.getNodePosition(link.fromId);
      var toPos = layout.getNodePosition(link.toId);
      var ui = lines.add(new wgl.Line(fromPos, toPos));
      linkIdToUI.set(link.id, ui);
    })

    scene.add(lines);
    var layoutStepsCount = 0;
    requestAnimationFrame(frame)

    function frame() {
      layout.step();
      layoutStepsCount += 1;
      updatePositions();
      if (layoutStepsCount < 1000) {
        requestAnimationFrame(frame);
      }
    }

    function updatePositions() {
      graph.forEachNode(node => {
        var pos = layout.getNodePosition(node.id);
        nodeIdToUI.get(node.id).update(pos);
      });
      graph.forEachLink(link => {
        var fromPos = layout.getNodePosition(link.fromId);
        var toPos = layout.getNodePosition(link.toId);
        linkIdToUI.get(link.id).update(fromPos, toPos);
      })
    }
}
</script>

<style>
  canvas {
    width: 100%;
    height: 100%;
  }
</style>