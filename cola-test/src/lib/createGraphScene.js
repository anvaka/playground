import {createScene} from 'w-gl';
import LineCollection from './LineCollection';
import PointCollection from './PointCollection';
import bus from './bus';
import getGraph from './getGraph';
import createLayout from 'ngraph.forcelayout';
import * as cola from 'webcola';
import createGraph from 'ngraph.graph';

export default function createGraphScene(canvas) {
  let drawLinks = true;

  // Since graph can be loaded dynamically, we have these uninitialized
  // and captured into closure. loadGraph will do the initialization
  let graph, layout, forceLayout;
  let scene, nodes, lines, webcolaTurn = false;

  let wNodes = [], wLinks = [];

  let layoutSteps = 0; // how many frames shall we run layout?
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
      cancelAnimationFrame(rafHandle);
    }
    scene = initScene();
    graph = newGraph
    // let g = graph = createGraph()
    // g.addNode('a', {size: 10})
    // g.addNode('b', {size: 1})
    // g.addNode('d', {size: 5})
    // g.addNode('c', {size: 2})
    // g.addLink('a', 'b')
    // g.addLink('a', 'c')
    // g.addLink('a', 'd')
    // g.addLink('b', 'd')
    // g.addLink('c', 'd')
    // g.addLink('b', 'c')

    wNodes = [], wLinks = [];
    layout = new cola.Layout();
    layout.jaccardLinkLengths(1)
    // layout.linkDistance((l) => {
    //   let from = wNodes[l.source];
    //   let to = wNodes[l.target];
    //   let dist = (from.size + to.size)/2;
    //   if (!Number.isFinite(dist)) throw new Error('blah')
    //   return dist;
    // })
      .handleDisconnected(true);
    graph.forEachNode(node => {
      node._wId = wNodes.length;
      let wNode = {id: node.id};
      let size = 1;
      if (node.data && node.data.size !== undefined) {
        size = node.data.size;
      }

      wNode.size = wNode.height = wNode.width = size;
      wNodes.push(wNode)
    })
    graph.forEachLink(link => {
      let from = graph.getNode(link.fromId);
      let to = graph.getNode(link.toId);
      wLinks.push({
        source: from._wId,
        target: to._wId
      })
    });
    layout
      .nodes(wNodes)
      .links(wLinks)
      .avoidOverlaps(true)
      .convergenceThreshold(1e-9)
      .start(1, 0, 0, 0, false);
      //.start(140, 0, 40, 0, false);
    layout.tick();

    forceLayout = createLayout(graph, {
      timeStep: 0.5,
      springLength: 10,
      springCoeff: 1.0,
      gravity: -10,
      dragCoeff: 0.9,
    });

    graph.forEachNode(node => {
      if (!node.data || node.data.size === undefined) return;
      let body = forceLayout.getBody(node.id);
      body.mass = ((node.data.size) ** 2) * 0.2
    });
    // layout.step();
    initUIElements();

    rafHandle = requestAnimationFrame(frame);
  }

  function runLayout(stepsCount) {
    layoutSteps += stepsCount;
//    layout.resume(1);
  }

  function initScene() {
    let scene = createScene(canvas);
    scene.setClearColor(12/255, 41/255, 82/255, 1)
    let initialSceneSize = 40;
    scene.setViewBox({
      left:  -initialSceneSize,
      top:   -initialSceneSize,
      right:  initialSceneSize,
      bottom: initialSceneSize,
    });
    return scene;
  }
  
  function initUIElements() {
    nodes = new PointCollection(scene.getGL(), {
      capacity: graph.getNodesCount()
    });

    wNodes.forEach(node => {
      let size = 1;
      if (node.width) {
        size = node.width;
      } 
      node.ui = {size, position: [node.x, node.y, node.z || 0], color: 0x90f8fcff};
      node.uiId = nodes.add(node.ui);
    });

    lines = new LineCollection(scene.getGL(), { capacity: graph.getLinksCount() });

    graph.forEachLink(link => {
      var from = wNodes[graph.getNode(link.fromId)._wId];
      var to = wNodes[graph.getNode(link.toId)._wId];
      var line = { from: [from.x, from.y, from.z || 0], to: [to.x, to.y, to.z || 0], color: 0xFFFFFF10 };
      link.ui = line;
      link.uiId = lines.add(link.ui);
    });

    scene.appendChild(lines);
    scene.appendChild(nodes);
  }

  function frame() {
    rafHandle = requestAnimationFrame(frame);

    if (layoutSteps > 0) {
      layoutSteps -= 1;
      webcolaTurn = (layoutSteps < 400);
      if (webcolaTurn) {
        layout.tick();
      } else {
        wNodes.forEach(node => {
          forceLayout.setNodePosition(node.id, node.x, node.y);
        });
        forceLayout.step();
        forceLayout.step();
        forceLayout.step();
        let x = layout._descent.x;
        wNodes.forEach((node, i) => {
          let pos = forceLayout.getNodePosition(node.id);
          node.x = x[0][i] = pos.x;
          node.y = x[1][i] = pos.y;
        });
        if (layoutSteps % 10 === 0) webcolaTurn = true
      }
    }
    drawGraph();
    scene.renderFrame();
  }

  function drawGraph() {
    wNodes.forEach(node => {
      let uiPosition = node.ui.position;
      uiPosition[0] = node.x;
      uiPosition[1] = node.y;
      uiPosition[2] = node.z || 0;
      nodes.update(node.uiId, node.ui)
    });

    if (drawLinks) {
      graph.forEachLink(link => {
        var fromPos = wNodes[graph.getNode(link.fromId)._wId];
        var toPos = wNodes[graph.getNode(link.toId)._wId];
        let {from, to} = link.ui;
        from[0] = fromPos.x; from[1] = fromPos.y; from[2] = fromPos.z || 0;
        to[0] = toPos.x; to[1] = toPos.y; to[2] = toPos.z || 0;
        lines.update(link.uiId, link.ui);
      })
    }
  }

  function dispose() {
    cancelAnimationFrame(rafHandle);

    scene.dispose();
    bus.off('load-graph', loadGraph);
  }
}