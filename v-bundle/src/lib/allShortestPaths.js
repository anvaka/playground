module.exports = getDistanceMap;

function getDistanceMap(graph, getDistance) {
  var distance = new Map()
  var Q = [];
  getDistance = getDistance || graphDistance;

  graph.forEachNode(calculateDistance);

  return distance;

  function calculateDistance(node) {
    singleSourceShortestPath(node.id);
  }

  function singleSourceShortestPath(source) {
    let distanceMap = new Map();
    distance.set(source, distanceMap)

    graph.forEachNode(setNegativeDistance);
    distanceMap.set(source, 0);

    Q.push(source);

    while (Q.length) {
      var v = Q.shift();
      graph.forEachLinkedNode(v, processNode);
    }

    return;

    function setNegativeDistance(node) {
      var nodeId = node.id;
      distanceMap.set(nodeId, -1);
    }

    function processNode(otherNode) {
      var w = otherNode.id
      if (distanceMap.get(w) === -1) {
        // Node w is found for the first time
        distanceMap.set(w, distanceMap.get(v) + getDistance(v, w));
        Q.push(w);
      }
    }
  }

  function graphDistance(/* a, b */) {
    return 1;
  }
}