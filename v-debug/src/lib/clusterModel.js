var louvain = require('ngraph.louvain');
var coarsen = require('ngraph.coarsen');
var centrality = require('ngraph.centrality');
// var eventify = require('ngraph.events');
var makeLayout = require('./makeLayout');
// var getFloatOrDefault = require('./getFloatOrDefault');

/// level 
///  * node 0
///  * node 1
///  * ...
///  * node k

class GraphLayer {
  constructor(graph, level = 0, initialPositions) {
    this.graph = graph;
    this.level = level;
    this.children = null;
    this.childrenLookup = new Map();
    this.layout = null;
    this.initialPositions = initialPositions;

    this.stepsCount = 0;

    this.settings = {
      steps: 200 + level * 200,
      selectedLayout: 'ngraph',
      springLength: 30 + level * 400,
      springCoeff: 0.0008,
      gravity: -10.2 - level * 12,
      theta: 0.8,
      dragCoeff: 0.02,
      timeStep: 10,
    }

    let self = this;
    if (this.level > 0) {
      // TODO: Need to normalize this.
      this.settings.nodeMass = function nodeMass(nodeId) {
        let child = self.childrenLookup.get(nodeId);
        return child.graph.getNodesCount();
      }
    } else {
      this.settings.nodeMass = function nodeMass(nodeId) {
        let node = graph.getNode(nodeId);
        if (node.links) return node.links.length;
        return 1;
      }
    }
  }

  reset(deep) {
    this.stepsCount = 0;
    if (deep && this.children) {
      this.children.forEach(child => child.reset(deep));
    }
  }

  makeLayout() {
    let layout = makeLayout(this.graph, this.settings);
    // let initialPositions = this.initialPositions;
    // if (initialPositions && layout.setNodePosition) {
    //   this.graph.forEachNode(node => {
    //     let pos = initialPositions.get(node.id);
    //     if (pos) layout.setNodePosition(node.id, pos.x, pos.y);
    //   })
    // }
    return layout;
  }

  step() {
    if (this.children) {
      this.children.forEach(child => child.step())
    }
    if (this.stepsCount >= this.settings.steps) {
      return;
    } 

    if (!this.layout) {
      return;
    }

    this.stepsCount += 1;
    this.layout.step();
  }

  addChild(child) {
    if (!this.children) {
      this.children = [];
    }
    if (!('id' in child)) throw new Error('child id is required');
    this.children.push(child);
    this.childrenLookup.set(child.id, child)
  }

  /**
   * Splits current graph into clsuters, returns parent graph layer.
   */
  split() {
    let clusterGraph = detectClusters(this.graph);
    let currentLevel = this.level;
    let parent = new GraphLayer(clusterGraph, currentLevel + 1);

    // This is our new set of top level nodes
    let subgraphs = coarsen.getSubgraphs(clusterGraph);

    let layout = this.layout;
    let ownChildren = this.childrenLookup;

    // Each subgraph is a graph, it becomes a node in the parent level graph
    subgraphs.forEach(subgraphInfo => {
      let subgraph = subgraphInfo.graph;
      let initialPositions = getInitialPositions(subgraph, layout);

      let child = new GraphLayer(subgraph, currentLevel, initialPositions);
      child.id = subgraphInfo.id;
      parent.addChild(child);

      if (ownChildren) {
        subgraph.forEachNode(function (node) {
          let grandChild = ownChildren.get(node.id);
          if (grandChild) {
            child.addChild(grandChild);
          }
        })
      }
      // TODO: we also need to make sure that each child has links to existing children
    })

    parent.reset(true);
    return parent;
  }
}

function getInitialPositions(subgraph, layout) {
  if (!layout) return;

  let positions = new Map();
  let maxX = Number.NEGATIVE_INFINITY;
  let minX = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  subgraph.forEachNode(function(node) {
    var pos = layout.getNodePosition(node.id);
    positions.set(node.id, pos);
    if (pos.x < minX) minX = pos.x;
    if (pos.y < minY) minY = pos.y;
    if (pos.x > maxX) maxX = pos.x;
    if (pos.y > maxY) maxY = pos.y;
  });
  // move center to (0, 0)
  let cx = (maxX + minX)/2;
  let cy = (maxY + minY)/2;
  positions.forEach(v => {
    v.x -= cx;
    v.y -= cy;
  });

  return positions;
}

function detectClusters(srcGraph) {
  var clusters = louvain(srcGraph);
  var clusterGraph = coarsen(srcGraph, clusters);

  return clusterGraph;
}

function init(rootGraph) {
  var root = new GraphLayer(rootGraph);

  var api = {
    root
  };

  return api;
}

module.exports = init;