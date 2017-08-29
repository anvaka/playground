var louvain = require('ngraph.louvain');
var coarsen = require('ngraph.coarsen');
var buildNodeMassFunction = require('./buildNodeMassFunction');
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
    this.id = 'root';
    this.children = null;
    this.childrenLookup = new Map();
    this.layout = null;
    this.initialPositions = initialPositions;

    this.stepsCount = 0;

    this.settings = {
      steps: 200,
      selectedLayout: 'ngraph',
      springLength: 30,// + level * 200,
      springCoeff: 0.0008,
      gravity: -1.2, // - level * 6,
      theta: 0.8,
      dragCoeff: 0.02,
      timeStep: 10,
    }

    this.settings.nodeMass = buildNodeMassFunction(this)
  }

  freeze() {
    // this is mostly to preven vue from monitoringn some properties.
    Object.freeze(this.layout);
    Object.freeze(this.childrenLookup);
    Object.freeze(this.graph);
  }

  findPoint(nodeId) {
    if (this.children && this.children.length) {
      for (let i = 0; i < this.children.length; ++i) {
        let child = this.children[i]
        let foundCluster = child.findPoint(nodeId)
        if (foundCluster) return foundCluster;
      }
    } else {
      if (this.graph.getNode(nodeId)) {
        return this;
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
    let graph = this.graph;
    let layout = makeLayout(graph, this.settings);
    if (this.level > 0) {
      // graph.forEachLink(link => {
      //   let spring = layout.getSpring(link.id);
      //   spring.weight = link.data * 0.3;
      // });
    }
    // let initialPositions = this.initialPositions;
    // if (initialPositions && layout.setNodePosition) {
    //   this.graph.forEachNode(node => {
    //     let pos = initialPositions.get(node.id);
    //     if (pos) layout.setNodePosition(node.id, pos.x, pos.y);
    //   })
    // }
    return layout;
  }

  getMass() {
    if (this.mass) return this.mass;

    let mass = 0;
    let self = this;
    this.graph.forEachNode(node => {
      mass += self.settings.nodeMass(node.id);
    })

    this.mass = mass;
    return mass;
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

    let layout = this.layout;
    this.stepsCount += 1;
    if (layout.simulator) {
      let t = (this.settings.steps - this.stepsCount) / this.settings.steps;
      let ts = this.settings.timeStep * t;
      this.layout.simulator.timeStep(ts);
      // d3 doesn't need this. TODO: Is there a better way to have this as uniform API?
    }
    layout.step();
    // TODO: This might be very slow.
    normalizePositions(this.graph, this.layout);
  }

  appendChild(child) {
    if (!this.children) {
      this.children = [];
    }
    if (!('id' in child)) throw new Error('child id is required');
    child.parent = this;
    this.children.push(child);
    this.childrenLookup.set(child.id, child)
  }

  removeChild(child) {
    if (this.children) {
      let childIdx = this.children.indexOf(child);
      if (childIdx > -1) {
        this.children.splice(childIdx, 1);
        this.childrenLookup.delete(child.id);
      }
    }
  }

  /**
   * Splits current graph into clsuters, returns parent graph layer.
   */
  split() {
    let clusterGraph = detectClusters(this.graph);
    let currentLevel = this.level;
    let parent = new GraphLayer(clusterGraph, currentLevel + 1);
    parent.settings.selectedLayout = this.settings.selectedLayout;
    if (this.parent) {
      parent.id = this.id;
    }

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
      parent.appendChild(child);

      if (ownChildren) {
        subgraph.forEachNode(function (node) {
          let grandChild = ownChildren.get(node.id);
          if (grandChild) {
            child.appendChild(grandChild);
          }
        })
      }
      // TODO: we also need to make sure that each child has links to existing children
    })

    parent.reset(true);
    parent.freeze();
    return parent;
  }

  buildNodePositions(result, dx, dy) {
    dx = dx || 0;
    dy = dy || 0;
    result = result || new Map();
    let layout = this.layout;
    if (this.children) {
      this.children.forEach(child => {
        let childPos = layout.getNodePosition(child.id);
        if (!childPos) throw new Error('Child position is missing');

        child.buildNodePositions(result, dx + childPos.x, dy + childPos.y);
      })
    } else {
      this.graph.forEachNode(node => {
        let pos = layout.getNodePosition(node.id);
        result.set(node.id, {
          x: pos.x + dx,
          y: pos.y + dy
        });
      })
    }

    return result;
  }

  getOwnOffset(x = 0, y = 0) {
    if (!this.parent)  {
      return { x, y };
    }

    let thisPos = this.parent.layout.getNodePosition(this.id);
    return this.parent.getOwnOffset(x + thisPos.x, y + thisPos.y);
  }
}

function normalizePositions(graph, layout) {
  let pos = getInitialPositions(graph, layout)
  pos.forEach((pos, nodeId) => {
    layout.setNodePosition(nodeId, pos.x, pos.y);
  })
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
  console.log('Original modularity: ' + clusters.originalModularity + '; New modularity: ' + clusters.newModularity);
  var clusterGraph = coarsen(srcGraph, clusters);

  return clusterGraph;
}

function init(rootGraph) {
  var root = new GraphLayer(rootGraph);

  var api = {
    root,
    getClusterPath,
    rootGraph,
    selectedCluster: root
  };

  Object.freeze(rootGraph);
  root.freeze();
  return api;

  function getClusterPath(pointId) {
    let path = [];
    let clusterWithNode = this.root.findPoint(pointId);
    while(clusterWithNode) {
      path.push(clusterWithNode);
      clusterWithNode = clusterWithNode.parent;
    }

    return path;
  }
}

module.exports = init;