<template>
  <canvas></canvas>
</template>

<script>
const wgl = require('../lib/wgl/index');
const makeLayout = require('ngraph.forcelayout');

export default {
  name: 'Scene',
  props: ['graph', 'settings'],
  mounted() {
    this.createScene();
  },
  watch: {
    settings: {
      handler(newValue) {
        this.createScene();
      },
      deep: true
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

      var graph = this.graph;
      let canvas = this.$el;
      let scene = wgl.scene(canvas);
      let useGraph = true;
      if (useGraph) {
        this.graphScene = renderGraph(graph, scene, getPhysicSettings(this.settings));
      }
    }
  },
  beforeDestroy() {
    this.destroyScene()
  }
}

function getPhysicSettings(settings) {
  return {
    springLength: getFloatOrDefault(settings.springLength,  30),
    springCoeff:  getFloatOrDefault(settings.springCoeff,   0.0008),
    gravity:      getFloatOrDefault(settings.gravity,       -1.2),
    theta:        getFloatOrDefault(settings.theta,         0.8),
    dragCoeff:    getFloatOrDefault(settings.dragCoeff,     0.02),
    timeStep:     getFloatOrDefault(settings.timeStep,      20)
  }
}

function getFloatOrDefault(x, defaultValue) {
  var value = Number.parseFloat(x);
  if (Number.isNaN(value)) return defaultValue;
  return value;
}

function renderGraph(graph, scene, layoutSettings) {
    var layout = makeLayout(graph, layoutSettings);
    let nodeCount = graph.getNodesCount();
    let nodes = new wgl.Points(nodeCount);
    let nodeIdToUI = new Map();
    let linkIdToUI = new Map();

    graph.forEachNode(node => {
      var point = layout.getNodePosition(node.id);
      point.size = Math.random() * 10 + 1;
      point.color = {
        r: (1 + Math.random()) * 0.5,
        g: (1 + Math.random()) * 0.5,
        b: (1 + Math.random()) * 0.5
      }
      var ui = nodes.add(point);
      nodeIdToUI.set(node.id, ui);
    })

    let initialSceneSize = 350;
    scene.setViewBox({
      left:  -initialSceneSize,
      top:   -initialSceneSize,
      right:  initialSceneSize,
      bottom: initialSceneSize,
    })

    let lines = new wgl.Wires(graph.getLinksCount());

    lines.color.r = 0.04
    lines.color.a = 0.15

    graph.forEachLink(link => {
      var from = layout.getNodePosition(link.fromId);
      var to = layout.getNodePosition(link.toId);
      var line = { from, to };
      var ui = lines.add(line);

      linkIdToUI.set(link.id, ui);
    })

    scene.add(lines);
    scene.add(nodes);
    var layoutStepsCount = 0;
    var animationHandle = requestAnimationFrame(frame)

    return {
      dispose
    };

    function dispose() {
      if (animationHandle) {
        cancelAnimationFrame(animationHandle);
        animationHandle = null;
      }
      scene.dispose();
    }

    function frame() {
      layout.step();
      layoutStepsCount += 1;
      updatePositions();
      if (layoutStepsCount < 100) {
        animationHandle = requestAnimationFrame(frame);
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