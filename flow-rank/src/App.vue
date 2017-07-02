<template>
  <div id="app">
    <svg>
      <g ref='scene'>
        <path v-for='e in edges' :d='getPath(e)' stroke-width='1' :stroke='getLinkStrokeColor(e)'></path>
        <text v-for='e in edges' :x='getLabelPos(e, "x")' :y='getLabelPos(e, "y")' font-size=2>{{getEdgeLabel(e)}}</text>
        <circle v-for='c in nodes'
          :cx='c.x' :cy='c.y'
          r='5' fill='transparent' stroke='black'></circle>
        <text v-for='c in nodes' font-size=5
          :x='c.x - 5' :y='c.y - 6'
       >{{niceText(c)}}</text>
      </g>
    </svg>
    <div class='actions'>
      <a href='#' @click.prevent='step'>Make one step</a>
    </div>
  </div>
</template>

<script>

const panzoom = require('panzoom');
const miserables = require('miserables');
const createLayout = require('ngraph.forcelayout');
const randomAPI = require('ngraph.random');
const seededGenerator = randomAPI.random(42);
const pagerank = require('ngraph.pagerank');

const PROBABILITY_TO_MOVE = 0.25;
let graph = miserables

let flatNodes = []
const rank = pagerank(graph);
let layout = createLayout(graph, {
    nodeMass (nodeId) {
      return graph.getNode(nodeId).links.length
    }
})

// let population = 100/graph.getNodesCount()

graph.forEachNode(n => {
  n.data = {
    population: rank[n.id]
  };

  flatNodes.push(n.id)
})

let flatLinks = []
graph.forEachLink(l => {
  let fromRank = rank[l.fromId]
  let toRank = rank[l.toId]
  l.data = {
    carsPassed: fromRank + toRank
  }
  flatLinks.push(l);
})
flatLinks.sort((a, b) => {
  return b.data.carsPassed - a.data.carsPassed
})

const nodeVisitOrder = randomAPI.randomIterator(flatNodes, seededGenerator);

for (let i = 0; i < 100; ++i) {
  layout.step()
}

export default {
  name: 'app',
  mounted() {
    let pz = panzoom(this.$refs.scene);
    this.$refs.scene.addEventListener('zoom', e => {
      let t = pz.getTransform().scale;
      this.updateVisibleEdges(t)
    });
  },
  data() {
    const nodes = []
    const edges = []

    graph.forEachNode(n => {
      let pos = layout.getNodePosition(n.id);
      nodes.push({
        x: pos.x,
        y: pos.y,
        data: n.data
      })
    })


    flatLinks.slice(0, 100).forEach(l => {
      edges.push({
        from: layout.getNodePosition(l.fromId),
        to: layout.getNodePosition(l.toId),
        data: l.data
      })
    })

    return {
      nodes,
      edges,
      maxPassed: 0,
      minPassed: 0
    }
  },

  methods: {
    updateVisibleEdges(zoomLevel) {
      let linksCount = flatLinks.length
      let sliceSize = Math.round(linksCount * zoomLevel / 4)

      let edges = []
      flatLinks.slice(0, sliceSize).forEach(l => {
        edges.push({
          from: layout.getNodePosition(l.fromId),
          to: layout.getNodePosition(l.toId),
          data: l.data
        })
      })
      this.edges = edges;
    },
    getLinkStrokeColor (edge) {
      let w = edge.data.carsPassed - this.minPassed
      let l = this.maxPassed - this.minPassed
      if (l === 0) return 'rgba(0, 0, 0, 0.2)';

      return 'rgba(255, 0, 0, ' + w/l +')'
    },
    getPath (edge) {
      return `M${edge.from.x},${edge.from.y} L${edge.to.x},${edge.to.y}`
    },
    niceText(c) {
      return c.data.population.toFixed(2)
    },
    getEdgeLabel(e) {
      return e.data.carsPassed.toFixed(2)
    },
    getLabelPos(e, coordinate) {
      if (coordinate === 'x') {
        return (e.from.x + e.to.x) / 2
      }
      return (e.from.y + e.to.y) / 2
    },
    step() {
      // let max = this.maxPassed || 1;
      // for (let i = 0; i < 100; ++i) {
      // nodeVisitOrder.forEach(nodeId => {
      //   let node = graph.getNode(nodeId)
      //   let links = (node.links || [])
      //   let linkCount = links.length
      //   let personCount = node.data.population
      //
      //   for (let j = 0; j < personCount; ++j) {
      //     let decidedToMove = seededGenerator.nextDouble() < PROBABILITY_TO_MOVE
      //     if (!decidedToMove) continue;
      //
      //     // this person wants to go. Where?
      //     let roadId = seededGenerator.next(linkCount)
      //     let dstLink
      //
      //     // graph.forEachLinkedNode(nodeId, (otherNode, link) => {
      //     //   if (link.data.population === 0) {
      //     //     if (0.01 <
      //     //   }
      //     //   if (dstLink) return true;
      //     // })
      //
      //     dstLink.data.carsPassed += 1;
      //     node.data.population -= 1;
      //     if (dstLink.toId === node.id) {
      //       graph.getNode(dstLink.fromId).data.population += 1;
      //     } else {
      //       graph.getNode(dstLink.toId).data.population += 1;
      //     }
      //   }
      // });
      // }
      //
      // let minPassed = Number.POSITIVE_INFINITY;
      // let maxPassed = Number.NEGATIVE_INFINITY;
      // graph.forEachLink(l => {
      //   let w = l.data.carsPassed
      //   if (w > maxPassed) maxPassed = w;
      //   if (w < minPassed) minPassed = w;
      // });
      //
      // this.maxPassed = maxPassed;
      // this.minPassed = minPassed
    }
  }
}
</script>

<style>
body, svg, #app {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
}
.actions {
  position: absolute;
}
</style>
