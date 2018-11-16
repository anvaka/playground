import createPanZoom from 'panzoom';
import {MAX_DEPTH} from './buildGraph';
import createTextMeasure from './measureText';
import createAggregateLayout from './aggregateLayout';
import bus from '../bus';

let svg = require('simplesvg');

export default function createRenderer() {
  const scene = document.querySelector('#scene');
  const panzoom = createPanZoom(scene);
  panzoom.showRectangle({left: -500, right: 500, top: -500, bottom: 500});
  let nodes = new Map();
  let layout, graph, currentLayoutFrame = 0;
  let textMeasure = createTextMeasure(scene);
  bus.on('graph-ready', onGraphReady);

  return {
    render
  }

  function render(newGraph) {
    clearLastScene();
    graph = newGraph;

    layout = createAggregateLayout(graph);
    nodes = new Map();

    graph.forEachNode(addNode);
    graph.on('changed', onGraphStructureChanged);

    cancelAnimationFrame(currentLayoutFrame);
    currentLayoutFrame = requestAnimationFrame(frame)
  }

  function onGraphReady(readyGraph) {
    if (readyGraph === graph) {
      layout.setGraphReady();
    }
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
    const dRatio = (MAX_DEPTH - node.data.depth)/MAX_DEPTH;
    const uiAttributes = getNodeUIAttributes(node.id, dRatio);

    const text = svg('text')
    text.attr('font-size', uiAttributes.fontSize);
    text.text(node.id);

    const rect = svg('rect');
    rect.attr({
      x: uiAttributes.x,
      y: uiAttributes.y,
      width: uiAttributes.width,
      height: uiAttributes.height,
      rx: uiAttributes.rx,
      ry: uiAttributes.ry,
      fill: 'transparent',
      'stroke-width': uiAttributes.strokeWidth, 
      stroke: '#58585A'
    })

    const textContainer = svg('g');
    textContainer.appendChild(rect);
    textContainer.appendChild(text);
    let pos = getNodePosition(node.id);
    if (node.data.depth === 0) {
      layout.pinNode(node);
    }
    layout.addNode(node.id, uiAttributes);

    scene.appendChild(textContainer);
    nodes.set(node.id, textContainer);
    textContainer.attr('transform', `translate(${pos.x}, ${pos.y})`);
  }


  function getNodeUIAttributes(nodeId, dRatio) {
    const fontSize = 24 * dRatio + 12;
    const size = textMeasure(nodeId, fontSize);
    const width = size.totalWidth + size.spaceWidth * 6;
    const height = fontSize * 1.6;

    return {
      fontSize,
      width,
      height,
      x: -size.spaceWidth * 3,
      y: -height * 0.7,
      rx: 15 * dRatio + 2,
      ry: 15 * dRatio + 2,
      strokeWidth: 4 * dRatio + 1
    };
  }
  function updatePositions() {
    nodes.forEach((ui, nodeId) => {
      let pos = getNodePosition(nodeId)
      ui.attr('transform', `translate(${pos.x}, ${pos.y})`);
    });
  }

  function getNodePosition(nodeId) {
    return layout.getNodePosition(nodeId);
  }
}