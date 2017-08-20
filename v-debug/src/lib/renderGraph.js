var wgl = require('./wgl/index');
var makeLayout = require('./makeLayout');
var layoutSteps = 100;

module.exports = renderGraph;

function renderGraph(graph, scene, layoutSettings) {
    var layout = makeLayout(graph, layoutSettings);
    let nodeCount = graph.getNodesCount();
    let nodes = new wgl.Points(nodeCount);
    let nodeIdToUI = new Map();
    let linkIdToUI = new Map();

    graph.forEachNode(node => {
      var point = layout.getNodePosition(node.id);
      point.size = 1; // Math.random() * 10 + 1;
      point.color = {
        r: 0.99, // (1 + Math.random()) * 0.5,
        g: 0.93, // (1 + Math.random()) * 0.5,
        b: 236/256, // (1 + Math.random()) * 0.5
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

    lines.color.r = 83/256
    lines.color.g = 82/256
    lines.color.b = 139/256
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
      if (layoutStepsCount < layoutSteps) {
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