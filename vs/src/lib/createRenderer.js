import createPanZoom from 'panzoom';

let svg = require('simplesvg');
let createLayout = require('ngraph.forcelayout')

export default function createRenderer() {
  const scene = document.querySelector('#scene');
  const panzoom = createPanZoom(scene);
  let nodes = new Map();
  let layout, graph, currentLayoutFrame = 0;

  return {
    render
  }

  function render(newGraph) {
    clearLastScene();
    graph = newGraph;
    layout = createLayout(graph, {
      springLength: 40,
      springCoeff: 0.0005,
      gravity: -1.2,
      theta: 0.8,
      dragCoeff: 0.02,
      timeStep: 14,
      nodeMass(nodeId) {
        var links = graph.getLinks(nodeId);
        var mul = links ? links.length : 1;
        return nodeId.length * mul;
      }
    });

    window.layout = layout;
    nodes = new Map();

    graph.forEachNode(addNode);
    graph.on('changed', onGraphStructureChanged);

    cancelAnimationFrame(currentLayoutFrame);
    currentLayoutFrame = requestAnimationFrame(frame)
  }

  function frame() {
    currentLayoutFrame = requestAnimationFrame(frame)
    layout.step();
    updatePositions();
  }

  function onGraphStructureChanged(changes) {
    changes.forEach(change => {
      if (change.changeType === 'add' && change.node) {
        addNode(change.node);
      }
    })
  }

  function clearLastScene() {
    while (scene.lastChild) {
        scene.removeChild(scene.lastChild);
    }
  }

  function addNode(node) {
    const text = svg('text')
    text.text(node.id);

    const textContainer = svg('g');
    textContainer.appendChild(text);
    let pos = layout.getNodePosition(node.id);
    if (node.data.depth === 0) {
      layout.pinNode(node, true);
    }

    scene.appendChild(textContainer);
    nodes.set(node.id, textContainer);
    textContainer.attr('transform', `translate(${pos.x}, ${pos.y})`);
  }

  function updatePositions() {
    nodes.forEach((container, nodeId) => {
      let pos = layout.getNodePosition(nodeId);
      container.attr('transform', `translate(${pos.x}, ${pos.y})`);
    });
  }
}