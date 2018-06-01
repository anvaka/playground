import BBox from './bbox';
import createProjector from './createProjector';
var createGraph = require('ngraph.graph');
var asyncFor = require('rafor');

export default function constructGraph(osmResponse, filter, progress) {
  var lonLatBoundingBox = new BBox();

  var {elements} = osmResponse;

  elements.forEach(element => {
    if (element.type === 'node') {
      lonLatBoundingBox.addPoint(element.lon, element.lat);
    }
  });

  return constructGraphAndBounds();

  function constructGraphAndBounds() {
    var project = createProjector(lonLatBoundingBox);
    var graph = createGraph();
    var offset = new BBox();

    return new Promise(resolve => {
      asyncFor(elements, visit, () => {
          resolve({graph, bounds: offset});
        }
      );
    })

    function visit(element, elementIdx) {
      if (element.type === 'node') {
        if (filter && !filter(element)) {
          return;
        }
        var nodeData = project(element.lon, element.lat);
        offset.addPoint(nodeData.x, nodeData.y);
        graph.addNode(element.id, nodeData)
      } else if (element.type === 'way') {
        element.nodes.forEach((node, idx) => {
          if (idx > 0) {
            const from = element.nodes[idx - 1];
            const to = element.nodes[idx];
            if (graph.getNode(from) && graph.getNode(to)) {
              graph.addLink(from, to);
            }
          } 
        })
      }

      if ((elementIdx % 50000) === 0) {
        progress(elementIdx, elements.length);
      }
    }
  }
}