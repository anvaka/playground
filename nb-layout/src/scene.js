import appState from './appState';
import BBox from './BBox';
import createLayout from './nbLayout';

var wgl = require('w-gl');

export default function createScene(canvas) {
  var scene = wgl.scene(canvas);
  var graph = appState.getGraph();
  var layout = createLayout(graph, cleanUpSettings(appState.settings));
  var renderCtx;

  scene.setClearColor(12/255, 41/255, 82/255, 1)

  initSceneWithGraph(graph);
  var nextFrame = requestAnimationFrame(frame)

  return {
    dispose,
    updateLayoutParam
  };

  function updateLayoutParam(settings) {
    layout.updateSettings(cleanUpSettings(settings));
  }

  function cleanUpSettings(unsafeSettings) {
    var s = {};
    var k1 = parseFloat(unsafeSettings.k1);
    if (Number.isFinite(k1)) s.k1 = k1;

    var k2 = parseFloat(unsafeSettings.k2);
    if (Number.isFinite(k2)) s.k2 = k2;

    var k3 = parseFloat(unsafeSettings.k3);
    if (Number.isFinite(k3)) s.k3 = k3;

    var k4 = parseFloat(unsafeSettings.k4);
    if (Number.isFinite(k4)) s.k4 = k4;
    return s;
  }

  function dispose() {
    scene.dispose();
    cancelAnimationFrame(nextFrame);
  }

  function frame() {
    nextFrame = requestAnimationFrame(frame);
    layout.step();
    renderCtx.updatePosition();

    scene.renderFrame();
  }

  function initSceneWithGraph(graph) {
    setViewBoxToFitGraph(graph);
    renderCtx = initNodesAndEdges();

    scene.appendChild(renderCtx.edges);
    scene.appendChild(renderCtx.nodes);
  }

  function setViewBoxToFitGraph(graph) {
    var bbox = new BBox();
    graph.forEachLink(function (link) {
      let from = layout.getNodePosition(link.fromId);
      let to = layout.getNodePosition(link.toId);
      bbox.addPoint(from.x, from.y);
      bbox.addPoint(to.x, to.y);

    });
    bbox.growBy(bbox.width * 0.1)
    var dpp = window.devicePixelRatio;

    scene.setViewBox({
      left:  bbox.left/dpp,
      top:   bbox.top/dpp,
      right:  bbox.right/dpp,
      bottom: bbox.bottom/dpp,
    })
  }

  function initNodesAndEdges() {
    let nodeCount = graph.getNodesCount();
    let nodes = new wgl.PointCollection(nodeCount + 1);
    let nodeIdToUI = new Map();
    let linkIdToUI = new Map();

    graph.forEachNode(node => {
      var point = layout.getNodePosition(node.id);
      let size = 20;
      point.size = size
      point.color = {
        r: 114/255,
        g: 248/255,
        b: 252/255
      };

      let ui = nodes.add(point, node.id);
      nodeIdToUI.set(node.id, ui);
    });

    let edges = new wgl.WireCollection(graph.getLinksCount());
    edges.color.r = 6/255;
    edges.color.g = 255/255;
    edges.color.b = 70/255;
    edges.color.a = 0.2;

    graph.forEachLink(link => {
      var from = layout.getNodePosition(link.fromId);
      var to = layout.getNodePosition(link.toId);
      var ui = edges.add({ from, to });
      linkIdToUI.set(link.id, ui);
    });

    return {
      nodes,
      edges,
      updatePosition
    };

    function updatePosition() {
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