let createRandom = require('ngraph.random');

export default function createFakeLayout(graph) {
  let nodes = new Map();
  let random = createRandom(42);
  
  return {
    addNode,
    getNodePosition,
    step
  };

  function addNode(nodeId) {
    const pos = {
      x: (random.nextDouble() - 0.5) * 1000,
      y: (random.nextDouble() - 0.5) * 1000
    }
    nodes.set(nodeId, pos);
    return pos;
  }

  function getNodePosition(nodeId) {
    let pos = nodes.get(nodeId)
    if (!pos) {
      pos = addNode(nodeId);
    } 
    return pos;
  }

  function step() {

  }
}