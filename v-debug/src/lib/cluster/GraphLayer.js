var louvain = require('ngraph.louvain');
var coarsen = require('ngraph.coarsen');
var buildNodeMassFunction = require('./buildNodeMassFunction');
var makeLayout = require('./makeLayout');
var Rect = require('../geom/Rect')
var BBox = require('../geom/BBox');
var removeOverlaps = require('../overlaps/removeOverlaps');
var tojson = require('ngraph.tojson');

class GraphLayer {
  constructor(graph, level = 0, initialPositions) {
    this.graph = graph;
    this.level = level;
    this.id = 'root';
    this.children = null;
    this.childrenLookup = new Map();
    this.layout = null;
    // Initial positions
    this.initialPositions = initialPositions;
    this.modularityImproved = false;

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
    Object.freeze(this.graph);
    Object.freeze(this.childrenLookup);
  }

  getGraphJson() {
    if (this.layout) {
      let layout = this.layout;
      this.graph.forEachNode(node => {
        node.data = layout.getNodePosition(node.id)
      })
    }
    return tojson(this.graph);
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
    Object.freeze(layout);
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
      this.layout = this.makeLayout();
      Object.freeze(this.layout);
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
   * Splits current graph into clusters, returns parent graph layer.
   */
  split() {
    let clusters = detectClusters(this.graph);
    let clusterGraph = clusters.clusterGraph;
    if (!clusters.modularityImproved || clusters.modularityDiff < 0.1) return false;

    let currentLevel = this.level;
    let parent = new GraphLayer(clusterGraph, currentLevel + 1);
    parent.settings.selectedLayout = this.settings.selectedLayout;
    if (this.parent) {
      // TODO: this looks wrong for internal clusters
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
      child.freeze();
      // TODO: we also need to make sure that each child has links to existing children
    })

    parent.reset(true);
    parent.freeze();
    return parent;
  }

  forEachLeaf(callback) {
    if (this.children) {
      this.children.forEach(child => child.forEachLeaf(callback));
    } else {
      callback(this);
    }
  }

  forEachNode(callback) {
    if (this.children) {
      this.children.forEach(child => child.forEachNode(callback));
    }
    callback(this);
  }

  /**
   * Using current layout removes overlapping nodes. TODO: need to have notion of size.
   */
  removeOverlaps(overlapsOptions) {
    let rectangels = new Map();
    let layout = this.layout;
    let childrenLookup = this.childrenLookup;

    this.graph.forEachNode(node => {
      // todo: need to have notion of sizes.
      let pos = layout.getNodePosition(node.id);
      let child = childrenLookup.get(node.id);
      let childWidth = 20;
      let childHeight = 20;
      let dx = 0;
      let dy = 0;
      if (child) {
        let childBBox = child.getBoundingBox();
        childWidth = childBBox.width;
        childHeight = childBBox.height;
        dx = childBBox.cx;
        dy = childBBox.cy;
      }

      let rect = new Rect({
        left: dx + pos.x - childWidth / 2,
        top: dy + pos.y - childHeight / 2,
        width: childWidth,
        height: childHeight,
        dx, dy,
        id: node.id
      });
      rectangels.set(node.id, rect);
    })
    removeOverlaps(rectangels, overlapsOptions);

    rectangels.forEach(rect => {
      layout.setNodePosition(rect.id, rect.cx - rect.dx, rect.cy - rect.dy);
    });
    normalizePositions(this.graph, this.layout);
  }

  getBoundingBox() {
    // TODO this could be cached.
    let bbox = new BBox();
    // let ownOffset = this.getOwnOffset();
    let positions = this.buildNodePositions()
    positions.forEach(position => {
      bbox.addPoint(position)
    });
    // TODO: I need to account for node's dimensions.
    bbox.growBy(15);

    return bbox;
  }
  /**
   * Gets the flat map of bottom-most nodeds in this graph layer hierarchy.
   */
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
  if (pos) {
    pos.forEach((pos, nodeId) => {
      layout.setNodePosition(nodeId, pos.x, pos.y);
    })
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

  if (cx && cy) {
    positions.forEach(v => {
      v.x -= cx;
      v.y -= cy;
    });

    return positions;
  }
}

function detectClusters(srcGraph) {
  // TODO: Probably need to run a few iterations to get best split
  var clusters = louvain(srcGraph);
  console.log('Original modularity: ' + clusters.originalModularity + '; New modularity: ' + clusters.newModularity);
  var clusterGraph = coarsen(srcGraph, clusters);

  return {
    modularityImproved: clusters.canCoarse(),
    modularityDiff: Math.abs(clusters.newModularity - clusters.originalModularity),
    clusterGraph
  }
}

module.exports = GraphLayer;