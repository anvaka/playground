var eventify = require('ngraph.events');
var wgl = require('./wgl/index');

module.exports = renderGraph;

function renderGraph(model, canvas) {
  let scene = wgl.scene(canvas);

  let lastLevel = model.root;
  renderRecusriveLevel(lastLevel, scene);

  let initialSceneSize = 350;
  scene.setViewBox({
    left:  -initialSceneSize,
    top:   -initialSceneSize,
    right:  initialSceneSize,
    bottom: initialSceneSize,
  })

  let api = eventify({
    dispose,
    // showClusters
  });


  var animationHandle = requestAnimationFrame(frame)

  return api;

  function dispose() {
    if (animationHandle) {
      cancelAnimationFrame(animationHandle);
      animationHandle = null;
    }
    scene.dispose();
  }

  function frame() {
    lastLevel.step();
    lastLevel.updatePosition();
    animationHandle = requestAnimationFrame(frame);
  }

  function renderRecusriveLevel(level, parentUI) {
    let layout = level.makeLayout();
    Object.freeze(layout);
    level.layout = layout;

    let nodeIdToUI = new Map();

    if (level.children) {
      // only the bottom most level has no children
      level.children.forEach(appendGroup);
      level.updatePosition = updatePosition;
    } else {
      renderPlainGraph(level, parentUI);
    }

    function appendGroup(node) {
      var point = layout.getNodePosition(node.id);
      let rootUI = new wgl.Element();
      rootUI.transform.dx = point.x;
      rootUI.transform.dy = point.y;

      renderRecusriveLevel(node, rootUI)
      nodeIdToUI.set(node.id, rootUI);

      parentUI.appendChild(rootUI);
    }

    function updatePosition() {
      var {graph, layout} = level;
      graph.forEachNode(node => {
        var pos = layout.getNodePosition(node.id);
        var ui = nodeIdToUI.get(node.id);
        if (ui) {
          ui.transform.dx = pos.x;
          ui.transform.dy = pos.y;
          ui.worldTransformNeedsUpdate = true;
        }
      });

      if (level.children) {
        level.children.forEach(child => {
          if (child.updatePosition) child.updatePosition()
        });
      }
    }
  }

  function renderPlainGraph(level, parentUI) {
    let {graph} = level;

    let nodeCount = graph.getNodesCount();
    let nodes = new wgl.Points(nodeCount);
    let nodeIdToUI = new Map();
    let linkIdToUI = new Map();

    // var layoutSteps = getFloatOrDefault(settings.steps, 100);
    var layout = level.makeLayout();
    Object.freeze(layout);
    level.layout = layout;
    level.updatePosition = updatePosition;

    graph.forEachNode(node => {
      var point = layout.getNodePosition(node.id);
      point.size = 10; // Math.random() * 10 + 1;
      point.color = {
        r: 0.99, // (1 + Math.random()) * 0.5,
        g: 0.93, // (1 + Math.random()) * 0.5,
        b: 236/256, // (1 + Math.random()) * 0.5
      }

      var ui = nodes.add(point);
      nodeIdToUI.set(node.id, ui);
    })


    let lines = new wgl.Wires(graph.getLinksCount());

    lines.color.r = 83/256;
    lines.color.g = 82/256;
    lines.color.b = 139/256;
    lines.color.a = 0.5;

    graph.forEachLink(link => {
      var from = layout.getNodePosition(link.fromId);
      var to = layout.getNodePosition(link.toId);
      var line = { from, to };
      var ui = lines.add(line);

      linkIdToUI.set(link.id, ui);
    });

    parentUI.appendChild(lines);
    parentUI.appendChild(nodes);


    function updatePosition() {
      var {graph, layout} = level;
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
}