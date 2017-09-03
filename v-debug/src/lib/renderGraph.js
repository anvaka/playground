var eventify = require('ngraph.events');
var wgl = require('./wgl/index');

module.exports = renderGraph;

const niceColors = getNiceColors(); 

const appendSceneDebugElements = false;

function renderGraph(model, canvas) {
  let scene = wgl.scene(canvas);
  // scene.setClearColor(28/255, 32/255, 59/255, 1)
  scene.setClearColor(12/255, 41/255, 82/255, 1)
  // scene.setClearColor(223/255, 223/255, 223/255);
  if (appendSceneDebugElements) addDebugElements(scene);

  let lastLevel = model.root;

  renderRecusriveLevel(lastLevel, scene);

  let initialSceneSize = 1050;
  scene.setViewBox({
    left:  -initialSceneSize,
    top:   -initialSceneSize,
    right:  initialSceneSize,
    bottom: initialSceneSize,
  })

  let api = eventify({
    dispose,
    toggleLinks,
    highlight,
    showRectangles,
    drawLines
  });

  var animationHandle = requestAnimationFrame(frame)

  var singletonElements = new Map();
  var lastLinks;
  var lastHighlight;
  var prevRectangles;
  scene.on('point-click', pointClick);
  scene.on('point-enter', pointEnter);
  scene.on('point-leave', pointLeave);

  return api;

  function drawLines(lines, options) {
    if (!lines) {
      removeIfNeeded(options.key);
      return;
    }

    options = options || {};
    let width = options.width || 1;
    let wglLines = new wgl.Lines(lines.length);

    if (options.key) rememberElement(options.key, wglLines);

    lines.forEach(l => {
      let ui = wglLines.add(l);
      ui.setWidth(width);
    })

    scene.appendChild(wglLines, options.sendToBack);
  }

  function removeIfNeeded(key) {
    let el = singletonElements.get(key);
    if (el) {
      el.parent.removeChild(el);
      singletonElements.delete(key);
    }
  }

  function rememberElement(key, el) {
    removeIfNeeded(key);
    singletonElements.set(key, el);
  }

  function showRectangles(rects, overwrite = true, color) {
    if (prevRectangles && overwrite) {
      scene.removeChild(prevRectangles);
    }

    let rectangles = new wgl.Lines(rects.length * 4);
    if (color) {
      rectangles.color = color
    }
    rects.forEach(rect => {
      let topLeft = {x: rect.left, y: rect.top };
      let topRight = {x: rect.right, y: rect.top };
      let bottomLeft = {x:  rect.left, y: rect.bottom };
      let bottomRight = {x: rect.right, y: rect.bottom };

      rectangles.add({ from: topLeft, to: topRight });
      rectangles.add({ from: topRight, to: bottomRight });
      rectangles.add({ from: bottomRight, to: bottomLeft });
      rectangles.add({ from: bottomLeft, to: topLeft });
    })
    scene.appendChild(rectangles);

    if (overwrite) prevRectangles = rectangles;
  }

  function highlight(positions) {
    if (lastHighlight) {
      scene.removeChild(lastHighlight);
    }
    if (!positions) return; // they wanted to remove highlight. That's it.

    let nodes = new wgl.Points(positions.size);
    positions.forEach((pos, id) => {
      pos.size = 30;
      let ui = nodes.add(pos, id);
      ui.setColor({
        r: 1, g: 254/255, b: 140/255
      });
    })
    scene.appendChild(nodes)
    lastHighlight = nodes;
  }

  function toggleLinks() {
    if (lastLinks) {
      scene.removeChild(lastLinks);
      lastLinks = null;
      return;
    }

    let globalPositions = model.root.buildNodePositions();
    let rootGraph = model.rootGraph;
    let lines = new wgl.Wires(rootGraph.getLinksCount());
    lines.color.a = 0.04;
    rootGraph.forEachLink(function (link) {
      let from = globalPositions.get(link.fromId);
      let to = globalPositions.get(link.toId);

      lines.add({ from, to });
    });
    lastLinks = lines;
    scene.appendChild(lines);
  }

  function dispose() {
    if (animationHandle) {
      cancelAnimationFrame(animationHandle);
      animationHandle = null;
    }

    scene.off('point-click', pointClick);
    scene.off('point-enter', pointEnter);
    scene.off('point-leave', pointLeave);
    scene.dispose();
  }

  function pointClick(p, coord) { api.fire('point-click', p, coord) }
  function pointEnter(p, coord) { api.fire('point-enter', p, coord) }
  function pointLeave(p, coord) { api.fire('point-leave', p, coord) }

  function frame() {
    lastLevel.step();
    lastLevel.updatePosition();
    animationHandle = requestAnimationFrame(frame);
  }

  function renderRecusriveLevel(level, parentUI, color) {
    let layout = level.makeLayout();
    level.layout = layout;

    if (level.children) {
      renderIntermediate(level, parentUI, color);
    } else {
      renderPlainGraph(level, parentUI, color);
    }
  }

  function renderIntermediate(level, parentUI, color) {
    let layout = level.layout;
    let nodeIdToUI = new Map();
    let linkIdToUI = new Map();

    level.children.forEach(appendGroup);

    let graph = level.graph;
    let linksCount = graph.getLinksCount()
    let lines;
    if (linksCount > 0) {
      lines = new wgl.Lines(graph.getLinksCount());
      if (color) {
        lines.color.r = color.r;
        lines.color.g = color.g;
        lines.color.b = color.b;
      } else {
        lines.color.r = 1.0;
        lines.color.g = 0.0;
        lines.color.b = 0.0;
        lines.color.a = 1;
      }
      graph.forEachLink(appendInterlevelLink);
      // parentUI.appendChild(lines);
    }

    level.updatePosition = updatePosition;

    return;

    function appendInterlevelLink(link) {
      if (link.fromId === link.toId) return;
      var from = layout.getNodePosition(link.fromId);
      var to = layout.getNodePosition(link.toId);
      var line = { from, to };
      var ui = lines.add(line);

      ui.setWidth(level.level * 3 + 1);

      linkIdToUI.set(link.id, ui);
    }

    function appendGroup(node, idx) {
      var point = layout.getNodePosition(node.id);
      let rootUI = new wgl.Element();
      rootUI.transform.dx = point.x;
      rootUI.transform.dy = point.y;

      let groupColor = color;
      if (!groupColor) {
        groupColor = niceColors[idx % niceColors.length];
      }

      renderRecusriveLevel(node, rootUI, groupColor);
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

  function renderPlainGraph(level, parentUI, color) {
    let {graph} = level;

    let nodeCount = graph.getNodesCount();
    let nodes = new wgl.Points(nodeCount + 1);
    let nodeIdToUI = new Map();
    let linkIdToUI = new Map();

    var layout = level.makeLayout();
    level.layout = layout;
    level.updatePosition = updatePosition;

    graph.forEachNode(node => {
      var point = layout.getNodePosition(node.id);
      let size = 10;
      if (node.data && node.data.size) {
        size = node.data.size;
      } else {
        console.error('Size is missing for ', node.id)
      }
      point.size = size
      if (color) {
        point.color = color;
      } else {
        point.color = {
          r: 114/255, // (1 + Math.random()) * 0.5,
          g: 248/255, // (1 + Math.random()) * 0.5,
          b: 252/255, // (1 + Math.random()) * 0.5
        }
      }
      // point.color =  {
      //   r: 237/255, // (1 + Math.random()) * 0.5,
      //   g: 237/255, // (1 + Math.random()) * 0.5,
      //   b: 237/255, // (1 + Math.random()) * 0.5
      // }


      var ui = nodes.add(point, node.id);
      nodeIdToUI.set(node.id, ui);
    })

    // let ui = nodes.add({
    //   x: 0,
    //   y: 0,
    //   size: 20,
    // });
    // ui.setColor(color || {
    //   r: 1, g: 0, b: 0
    // });

    let lines = new wgl.Wires(graph.getLinksCount());
    if (color) {
      lines.color.r = color.r;
      lines.color.g = color.g;
      lines.color.b = color.b;
      lines.color.a = 0.02;
    } else {
      lines.color.r = 6/255;
      lines.color.g = 28/255;
      lines.color.b = 70/255;
      lines.color.a = 0.02;
    }

    graph.forEachLink(link => {
      var from = layout.getNodePosition(link.fromId);
      var to = layout.getNodePosition(link.toId);
      var line = { from, to };
      var ui = lines.add(line);
      // ui.setWidth(1)
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

function addDebugElements(scene) {
  let first = new wgl.Element();
  first.transform.dx = 100;
  first.transform.dy = 0;
  first.transform.scale = 1;
  let fp = new wgl.Points(1);
  fp.add({
    x: 0, y: 0, size: 15
  });

  let lines = new wgl.Wires(1);
  lines.add({
     from: {x: -100, y: 0},
     to: {x: 100, y: 0},
  })

  let second = new wgl.Element();
  second.transform.dx = -100;
  second.transform.dy = 0;
  second.transform.scale = 1;
  let sp = new wgl.Points(1);
  sp.add({
    x: 0, y: 0, size: 15
  });
  first.appendChild(fp);
  second.appendChild(sp);

  scene.appendChild(first);
  scene.appendChild(second);
  scene.appendChild(lines);


  let third = new wgl.Element();
  third.transform.dx = 0;
  third.transform.dy = -10;
  third.transform.scale = 1;
  sp = new wgl.Points(2);
  sp.add({
    x: -100, y: 0, size: 5
  });
  sp.add({
    x: 100, y: 0, size: 5
  });
  third.appendChild(sp);
  lines = new wgl.Wires(1);
  lines.add({
     from: {x: -100, y: 0},
     to: {x: 100, y: 0},
  });


  third.appendChild(lines);
  scene.appendChild(third);
}

function getNiceColors() {
  return ['#7FDBFF', '#01FF70', '#FFDC00', '#F012BE', '#FFFFFF', '#0074D9']
    .map(str => {
      return {
        r: parseInt(str.substr(1, 2), 16)/255,
        g: parseInt(str.substr(3, 2), 16)/255,
        b: parseInt(str.substr(5, 2), 16)/255
      }
    });
}