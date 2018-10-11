import getFloatOrDefault from '../getFloatOrDefault';
import { forceLink, forceManyBody, forceSimulation, forceCenter } from 'd3-force';

export default function d3Layout(graph, settings) {
  var api = {
    getNodePosition,
    step,
    setNodePosition
  };

  var nodes = [];
  var nodeIndexLookup = new Map();
  graph.forEachNode(n => {
    var d3Node = {
      id: n.id
    };
    nodes.push(d3Node);
    nodeIndexLookup.set(n.id, nodes.length - 1);
  });
  var links = [];

  graph.forEachLink(link => {
    links.push({
      source: nodeIndexLookup.get(link.fromId),
      target: nodeIndexLookup.get(link.toId),
    });
  })

  var springLength = getFloatOrDefault(settings.springLength,  30);
  var link = forceLink(links).distance(function() {
    return springLength;
  });
  var gravity = getFloatOrDefault(settings.gravity, -30);
  var nbody = forceManyBody()
    .theta(getFloatOrDefault(settings.theta, 0.8))
    .strength(function() {
      return gravity;
    })
  var simulation = forceSimulation(nodes)
    .force("charge", nbody)
    .force("link", link)
    .force("center", forceCenter());

  simulation.stop()

  return api;

  function step() {
    simulation.tick();
  }

  function getNodePosition(nodeId) {
    var idx = nodeIndexLookup.get(nodeId);
    return nodes[idx];
  }

  function setNodePosition(nodeId, x, y) {
    var idx = nodeIndexLookup.get(nodeId);
    nodes[idx].x = x;
    nodes[idx].y = y;
  }
}