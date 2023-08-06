const fs = require('fs');
const createGraph = require('ngraph.graph');
const fromDot = require('ngraph.fromdot');
const createLayout = require('ngraph.forcelayout');
const getWeaklyConnectedComponents = require('./lib/getDisconnectedComponents');
const toDot = require('ngraph.todot');

const fileName = process.argv[2] || 'graph.dot';
const outputName = process.argv[3] || 'graph-layouted.dot';
console.log('Reading graph from ' + fileName + '...');
const graph = fromDot(fs.readFileSync(fileName, 'utf8'));
console.log('Graph has ' + graph.getNodesCount() + ' nodes and ' + graph.getLinksCount() + ' links');

// Here is our plan:
// 1. Collect all disconnected components of the graph
// 2. For each component do the local layout
// 3. Combine all components into one layout
let disconnectedComponents = getWeaklyConnectedComponents(graph);
disconnectedComponents.sort((a, b) => b.length - a.length);
disconnectedComponents.forEach(layoutComponent);

// Let's do circular surrounding around the largest (first) component:
let largestComponent = disconnectedComponents[0];
let largestComponentRect = getRect(largestComponent);
let largestComponentCenter = getCenter(largestComponentRect);
let largestComponentRadius = getRadius(largestComponentRect, largestComponentCenter);

for (let i = 1; i < disconnectedComponents.length; ++i) {
  let component = disconnectedComponents[i];
  let rect = getRect(component);
  let center = getCenter(rect);
  let radius = getRadius(rect, center);
  let angle = Math.random() * Math.PI * 2;
  let x = largestComponentCenter.x + largestComponentRadius * Math.cos(angle);
  let y = largestComponentCenter.y + largestComponentRadius * Math.sin(angle);
  moveComponent(component, x - center.x, y - center.y);
}

disconnectedComponents.forEach(component => {
  component.forEach(node => {
    let pos = node.data.position;
    let data = graph.getNode(node.id).data;
    node.position = data.position;
  });
});

// global layout:
const globalLayout = createLayout(graph, {
      timeStep: 0.5,
      springLength: 10,
      springCoefficient: 0.8,
      gravity: -12,
      dragCoefficient: 0.9,
});
for (let i = 0; i < 200; ++i) {
  globalLayout.step();
}
setNodePositions(graph, globalLayout);
graph.forEachNode(node => {
  const pos = globalLayout.getNodePosition(node.id );
  delete node.data.position;
  node.data.x = Math.round(pos.x);
  node.data.y = Math.round(pos.y);
});


fs.writeFileSync(outputName, toDot(graph));

function layoutComponent(nodes) {
  let r = 10;
  if (nodes.length === 1) {
    nodes[0].data.position = { x: 0, y: 0 };
    return;
  } else if (nodes.length === 2) {
    nodes[0].data.position = { x: 0, y: 0 };
    let angle = Math.random() * Math.PI * 2;
    nodes[1].data.position = { x: r * Math.cos(angle), y: r * Math.sin(angle) };
    return;
  } else if (nodes.length === 3) {
    let angle = Math.random() * Math.PI * 2;
    nodes[0].data.position = { x: 0, y: 0 };
    nodes[1].data.position = { x: r * Math.cos(angle), y: r * Math.sin(angle) };
    nodes[2].data.position = { x: r * Math.cos(angle + Math.PI), y: r * Math.sin(angle + Math.PI) };
    return;
  }

  const subgraph = createSubgraph(nodes);
  const layout = createLayout(subgraph, {
    timeStep: 0.5,
    springLength: 10,
    springCoefficient: 0.8,
    gravity: -12,
    dragCoefficient: 0.9,
  });
  for (let i = 0; i < 600; ++i) {
    layout.step();
  }
  setNodePositions(subgraph, layout);
}

function createSubgraph(nodes) {
  const subgraph = createGraph();
  nodes.forEach(node => {
    subgraph.addNode(node.id, node.data);
    graph.forEachLinkedNode(node.id, other => {
      subgraph.addLink(node.id, other.id);
    });
  });
  return subgraph;
} 

function setNodePositions(subgraph, layout) {
  let rect = layout.getGraphRect();
  // {min_x, min_y, max_x, max_y} - shift it to the center
  let width = rect.max_x - rect.min_x;
  let height = rect.max_y - rect.min_y;
  subgraph.forEachNode(node => {
    let pos = layout.getNodePosition(node.id);
    node.data.position = { 
      x: pos.x - rect.min_x - width / 2, 
      y: pos.y - rect.min_y - height / 2 
    };
  });
}

function getRect(component) {
  let min_x = Infinity;
  let min_y = Infinity;
  let max_x = -Infinity;
  let max_y = -Infinity;
  component.forEach(node => {
    let pos = node.data.position;
    if (pos.x < min_x) min_x = pos.x;
    if (pos.y < min_y) min_y = pos.y;
    if (pos.x > max_x) max_x = pos.x;
    if (pos.y > max_y) max_y = pos.y;
  });
  return { min_x, min_y, max_x, max_y };
}

function getCenter(rect) {
  return {
    x: (rect.min_x + rect.max_x) / 2,
    y: (rect.min_y + rect.max_y) / 2
  };
}

function getRadius(rect, center) {
  let dx = rect.max_x - center.x;
  let dy = rect.max_y - center.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function moveComponent(component, dx, dy) {
  component.forEach(node => {
    let pos = node.data.position;
    pos.x += dx;
    pos.y += dy;
  });
}