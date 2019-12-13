import { scene as makeWGLScene, PointCollection, WireCollection} from 'w-gl';
import bus from './bus';
import getGraph from './getGraph';
import createLayout from 'ngraph.forcelayout';
import createBoidLayout from './boids/createBoidLayout';
import BezierEasing from 'bezier-easing';
let createRandom = require('ngraph.random');

export default function createScene(canvas) {
  let drawLinks = true;

  // Since graph can be loaded dynamically, we have these uninitialized
  // and captured into closure. loadGraph will do the initialization
  let graph, layout, forceLayout, boidLayout, transitionLayout;
  let scene, linkUI, nodeUI;

  let linkIdToUI = new Map();
  let layoutSteps = 500; // how many frames shall we run layout?
  let transitionSteps = 0;
  let boidSteps = 500;
  let rafHandle;

  loadGraph(getGraph());
  bus.on('load-graph', loadGraph);

  return {
    dispose,
    runLayout,
  };

  function loadGraph(newGraph) {
    if (scene) {
      scene.dispose();
      scene = null
    }
    scene = initScene();
    graph = newGraph

    boidLayout = layout = createBoidLayout(graph);
    forceLayout = createLayout(graph, {
      timeStep: 5 
    });

    layout.step();
    drawLinks = false;
    let ui = initUIElements();
    linkUI = ui.linkUI;
    nodeUI = ui.nodeUI;

    rafHandle = requestAnimationFrame(frame);
  }

  function runLayout(stepsCount) {
    layoutSteps += stepsCount;
  }

  function initScene() {
    let scene = makeWGLScene(canvas);
    scene.setClearColor(12/255, 41/255, 82/255, 1)
    let initialSceneSize = 300;
    scene.setViewBox({
      left:  -initialSceneSize,
      top:   -initialSceneSize,
      right:  initialSceneSize,
      bottom: initialSceneSize,
    });
    return scene;
  }
  
  function initUIElements() {
    let nodeIdToUI = new Map();
    let nodes = new PointCollection(graph.getNodesCount());
    graph.forEachNode(node => {
      var point = layout.getNodePosition(node.id);
      let size = 10;
      if (node.data && node.data.size) {
        size = node.data.size;
      } else {
        if (!node.data) node.data = {};
        node.data.size = size;
      }
      point.size = size
      point.color = {
        r: 114/255,
        g: 248/255,
        b: 252/255,
      }
      var ui = nodes.add(point, node.id);
      nodeIdToUI.set(node.id, ui);
    });

    if (drawLinks) {
      createLinksElements();
    }
    scene.appendChild(nodes);

    return {nodeUI: nodeIdToUI, linkUI: linkIdToUI};
  }

  function createLinksElements() {
    let lines = new WireCollection(graph.getLinksCount());
    lines.color.r = 6/255;
    lines.color.g = 28/255;
    lines.color.b = 70/255;
    lines.color.a = 0.2;

    graph.forEachLink(link => {
      var from = layout.getNodePosition(link.fromId);
      var to = layout.getNodePosition(link.toId);
      var line = { from, to };
      var ui = lines.add(line);
      linkIdToUI.set(link.id, ui);
    });

    scene.appendChild(lines);
  }

  function frame() {
    rafHandle = requestAnimationFrame(frame);

    if (boidSteps > 0) {
      boidSteps -= 1;
      boidLayout.step();
      forceLayout.step()
      if (boidSteps === 50) {
        transitionSteps = 1000;
        layout = createTransitionLayout(graph, boidLayout, forceLayout);
        transitionLayout = layout;
      }
    } 
    if (transitionSteps > 0) {
      transitionSteps -= 1;
      layout.step();
      if (!drawLinks && transitionLayout.isDone()) {
        drawLinks = true;
        createLinksElements();
      }
    }
    drawGraph();
    scene.renderFrame();
  }

  function drawGraph() {
    graph.forEachNode(node => {
      var pos = layout.getNodePosition(node.id);
      nodeUI.get(node.id).update(pos);
    });

    if (drawLinks) {
      graph.forEachLink(link => {
        var fromPos = layout.getNodePosition(link.fromId);
        var toPos = layout.getNodePosition(link.toId);
        linkUI.get(link.id).update(fromPos, toPos);
      })
    }
  }

  function dispose() {
    cancelAnimationFrame(rafHandle);

    bus.off('load-graph', loadGraph);
  }
}

function createTransitionLayout(graph, fromLayout, toLayout) {
  let random = createRandom(42);
  let easing = BezierEasing(1, 0, 0, 1.0);
  let nodes = new Map();
  let timeFrame = 0;
  let maxFrame = Number.NEGATIVE_INFINITY;

  graph.forEachNode(node => {
    let startAt = Math.max(0, Math.round(random.gaussian() * 10) + 20);
    let lifeSpan = 100;
    if (startAt + lifeSpan > maxFrame) maxFrame = startAt + lifeSpan;
    nodes.set(node.id, {
      from: fromLayout.getNodePosition(node.id),
      to: toLayout.getNodePosition(node.id),
      startAt,
      lifeSpan,
    });
  });

  return {
    step,
    getNodePosition,
    isDone
  };

  function isDone() {
    return timeFrame > maxFrame * 0.85;
  }

  function step() {
    timeFrame += 1;
  }

  function getNodePosition(nodeId) {
    let record = nodes.get(nodeId);
    if (record.startAt >= timeFrame) {
      return record.from;
    }
    if (record.lifeSpan + record.startAt < timeFrame) {
      return record.to;
    }
    let delta = (timeFrame - record.startAt) / record.lifeSpan;
    let t = easing(Math.min(delta, 1));
    let x = record.from.x + (record.to.x - record.from.x) * t;
    let y = record.from.y + (record.to.y - record.from.y) * t;
    return {x, y};
  }
}