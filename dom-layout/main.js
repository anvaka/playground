import './style.css';
import forceLayout from 'ngraph.forcelayout';
import panzoom from 'panzoom';
import getGraph from './getGraph';

const ITERATIONS_COUNT = 500;
let currentIteration = 0;
const graph = getGraph();
const rootId = 'Normal gets you nowhere';
assignNodeLevelsStartingFromRoot(graph, rootId);

const layout = forceLayout(graph, {
  timeStep: 0.,
  adaptiveTimeStepWeight: .05,
  springLength: 300,
  springCoefficient: 0.25,
  gravity: -0.45,
  dragCoefficient: 0.8,
  nodeMass(nodeId) {
    let links = graph.getLinks(nodeId);
    let mul = links ? links.size : 1;
    // TODO: should be adjusted based on the size of the rectangle
    let mass = nodeId.length * mul * 25;
    return mass || 1;
  }
});
layout.pinNode(graph.getNode(rootId), true);

layout.step();

requestAnimationFrame(updateLayout);

const graphContainer = document.querySelector('.zoomable');
const pzInstance = panzoom(graphContainer);
pzInstance.showRectangle({ left: -1000, top: -1000, right: 1000, bottom: 1000 });
const nodesContainer = document.querySelector('.nodes');
const linkContainer = document.querySelector('.links');

graph.forEachNode(function(node) {
  node.ui = createNodeUI(node);
  nodesContainer.appendChild(node.ui); 
  node.boundingRect = node.ui.getBoundingClientRect();
  setNodePosition(node);
});

graph.forEachLink(function (link) {
  let from = layout.getNodePosition(link.fromId);
  let to = layout.getNodePosition(link.toId);
  link.ui = createLinkUI(from, to);
  setLinkPosition(link, from, to);
  linkContainer.appendChild(link.ui);
})

function createNodeUI(node) {
  let nodeUI = document.createElement('div');
  nodeUI.classList.add('node');
  if (typeof node.level === 'number') {
    nodeUI.classList.add('level-' + node.level);
  }

  nodeUI.innerText = node.id;
  return nodeUI;
}

function createLinkUI(from, to) {
  let linkUI = document.createElement('div');
  linkUI.classList.add('link');
  return linkUI;
}

function setNodePosition(node) {
  let pos = layout.getNodePosition(node.id);
  let boundingRect = node.boundingRect;
  let width = boundingRect.width;
  let height = boundingRect.height;
  node.ui.style.left = `${pos.x - width / 2}px`;
  node.ui.style.top =  `${pos.y - height / 2}px`;
}

function setLinkPosition(link, from, to) {
  let dx = to.x - from.x;
  let dy = to.y - from.y;
  let angle = Math.atan2(dy, dx);
  let length = Math.sqrt(dx * dx + dy * dy);
  link.ui.style.transform = `translate(${from.x}px, ${from.y}px) rotate(${angle}rad)`;
  let levelMultiplier = getLinkLevelMultiplier(link);
  link.ui.style.height = `${2 ** levelMultiplier}px`;
  link.ui.style.width = `${length}px`;
}

function assignNodeLevelsStartingFromRoot(graph, rootId) {
  let visited = new Set();
  let queue = [rootId];
  let level = 0;
  while (queue.length > 0) {
    let nextQueue = [];
    for (let i = 0; i < queue.length; ++i) {
      let nodeId = queue[i];
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      graph.getNode(nodeId).level = level;
      graph.forEachLinkedNode(nodeId, function (linkedNode) {
        nextQueue.push(linkedNode.id);
      });
    }
    queue = nextQueue;
    ++level;
  }
}

function updateLayout() {
  currentIteration++;
  if (currentIteration < ITERATIONS_COUNT) requestAnimationFrame(updateLayout);
  layout.step();
  graph.forEachNode(function(node) {
    setNodePosition(node);
  });

  graph.forEachLink(function(link) {
    let from = layout.getNodePosition(link.fromId);
    let to = layout.getNodePosition(link.toId);
    // 0 is the largest level, so we need to invert it
    setLinkPosition(link, from, to);
  });
}

function getLinkLevelMultiplier(link) {
    let fromLevel = graph.getNode(link.fromId).level;
    let toLevel = graph.getNode(link.toId).level;
    let levelMultiplier = Math.max(1, 4 - Math.min(fromLevel, toLevel));
    return levelMultiplier;
}