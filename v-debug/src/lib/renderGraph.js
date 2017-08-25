var eventify = require('ngraph.events');
var wgl = require('./wgl/index');

module.exports = renderGraph;

function renderGraph(model, canvas) {
  let scene = wgl.scene(canvas);

  // let first = new wgl.Element();
  // first.transform.dx = 100;
  // first.transform.dy = 0;
  // first.transform.scale = 1;
  // let fp = new wgl.Points(1);
  // fp.add({
  //   x: 0, y: 0, size: 15
  // });
  // first.appendChild(fp);

  // let second = new wgl.Element();
  // second.transform.dx = -100;
  // second.transform.dy = 0;
  // second.transform.scale = 1;
  // let sp = new wgl.Points(1);
  // sp.add({
  //   x: 0, y: 0, size: 15
  // });
  // second.appendChild(sp);
  // scene.appendChild(first);
  // scene.appendChild(second);

  // let lines = new wgl.Wires(1);
  // lines.add({
  //    from: {x: -100, y: 0},
  //    to: {x: 100, y: 0},
  // })
  // scene.appendChild(lines);


  // let third = new wgl.Element();
  // third.transform.dx = 0;
  // third.transform.dy = -10;
  // third.transform.scale = 1;
  // sp = new wgl.Points(2);
  // sp.add({
  //   x: -100, y: 0, size: 5
  // });
  // sp.add({
  //   x: 100, y: 0, size: 5
  // });
  // third.appendChild(sp);
  // lines = new wgl.Wires(1);
  // lines.add({
  //    from: {x: -100, y: 0},
  //    to: {x: 100, y: 0},
  // })
  // third.appendChild(lines);
  // scene.appendChild(third);

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

    if (level.children) {
      renderIntermediate(level, parentUI);
    } else {
      renderPlainGraph(level, parentUI);
    }
    
  }

  function renderIntermediate(level, parentUI) {
    let layout = level.layout;
    let nodeIdToUI = new Map();
    let linkIdToUI = new Map();
    level.children.forEach(appendGroup);

    let graph = level.graph;
    let linksCount = graph.getLinksCount()
    let lines;
    if (linksCount > 0) {
      lines = new wgl.Wires(graph.getLinksCount());
      lines.color.r = 256;
      lines.color.a = 1;
      graph.forEachLink(appendInterlevelLink);
      parentUI.appendChild(lines);
    }

    level.updatePosition = updatePosition;

    return;

    function appendInterlevelLink(link) {
      if (link.fromId === link.toId) return;
      var from = layout.getNodePosition(link.fromId);
      var to = layout.getNodePosition(link.toId);
      var line = { from, to };
      var ui = lines.add(line);

      linkIdToUI.set(link.id, ui);
    }

    function appendGroup(node) {
      var point = layout.getNodePosition(node.id);
      let rootUI = new wgl.Element();
      // *0.5 because webgl space is between (-1, 1)
      rootUI.transform.dx = point.x * 0.5;
      rootUI.transform.dy = point.y * 0.5;

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
          ui.transform.dx = pos.x * 0.5;
          ui.transform.dy = pos.y * 0.5;
          ui.worldTransformNeedsUpdate = true;
        }
      });

      graph.forEachLink(link => {
        if (link.fromId === link.toId) return;
        var fromPos = layout.getNodePosition(link.fromId);
        var toPos = layout.getNodePosition(link.toId);
        linkIdToUI.get(link.id).update(fromPos, toPos);
      });

      if (level.children) {
        level.children.forEach(child => {
          if (child.updatePosition) child.updatePosition();
        });
      }
    }
  }

  function renderPlainGraph(level, parentUI) {
    let {graph} = level;

    let nodeCount = graph.getNodesCount();
    let nodes = new wgl.Points(nodeCount + 1);
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

    let ui = nodes.add({
      x: 0,
      y: 0,
      size: 20,
    });
    ui.setColor({
      r: 1, g: 0, b: 0
    });

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