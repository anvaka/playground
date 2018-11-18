import createPanZoom from 'panzoom';
import {MAX_DEPTH} from './buildGraph';
import createTextMeasure from './measureText';
import createAggregateLayout from './aggregateLayout';
import bus from '../bus';

let svg = require('simplesvg');

export default function createRenderer() {
  const scene = document.querySelector('#scene');
  const nodeContainer = scene.querySelector('#nodes');
  const edgeContainer = scene.querySelector('#edges');
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
    
    layout.on('ready', drawLinks);
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

  function drawLinks() {
    graph.forEachLink(drawLink);
  }

  function drawLink(link) {
    let from = layout.getNodePosition(link.fromId);
    let to = layout.getNodePosition(link.toId);
    var path = svg('path', {
      'stroke-width': 2,
      fill: 'black',
      stroke: 'darkgray',
      d: `M${from.x},${from.y} L${to.x},${to.y}`
    });
    edgeContainer.appendChild(path);
  }

  function clearLastScene() {
    clear(nodeContainer);
    clear(edgeContainer);
    if (layout) {
      layout.off('ready', drawLinks);
    }
  }

  function clear(el) {
    while (el.lastChild) {
        el.removeChild(el.lastChild);
    }
  }

  function addNode(node) {
    const dRatio = (MAX_DEPTH - node.data.depth)/MAX_DEPTH;
    const uiAttributes = getNodeUIAttributes(node.id, dRatio);

    const rect = svg('rect');
    rect.attr({
      x: uiAttributes.x,
      y: uiAttributes.y,
      width: uiAttributes.width,
      height: uiAttributes.height,
      rx: uiAttributes.rx,
      ry: uiAttributes.ry,
      fill: 'white',
      'stroke-width': uiAttributes.strokeWidth, 
      stroke: '#58585A'
    })

    const text = svg('text', {
      'font-size': uiAttributes.fontSize,
      x: uiAttributes.px,
      y: uiAttributes.py
    })
    text.text(node.id);

    const textContainer = svg('g');
    textContainer.appendChild(rect);
    textContainer.appendChild(text);
    let pos = getNodePosition(node.id);
    if (node.data.depth === 0) {
      layout.pinNode(node);
    }
    layout.addNode(node.id, uiAttributes);

    nodeContainer.appendChild(textContainer);
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
      x: -width/2,
      y: -height/2,
      rx: 15 * dRatio + 2,
      ry: 15 * dRatio + 2,
      px: -width/2 + size.spaceWidth*3,
      py: -height/2 + fontSize * 1.1,
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