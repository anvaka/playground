<template>
  <div id="app">
    <svg>
      <g ref='scene'>
        <path v-for='edge in edges' :d='getPath(edge)' stroke='rgba(80, 0, 30, 0.3)'
       :stroke-width='0.1'
        ></path>

        <path v-for='p in paths' :d='p' stroke='rgba(90, 90, 90, 0.1)' :stroke-width='0.4' fill=transparent></path>
        <circle v-for='r in nodes'
            :key='r.id'
            :cx='r.x'
            fill='RGB(218, 97, 97)'
            stroke='RGB(218, 97, 97)'
            @mousedown='onMouseDown($event, r)'
            :cy='r.y' :r='r.r'>
        </circle>
      </g>
    </svg>
  <div class='actions'>
    <button @click.prevent='tightenAll'>Tighten all edges</button>
  </div>
  </div>
</template>

<script>
const panzoom = require('panzoom')
const getGraph = require('./data/airlinesGraph.js')
let bundledGraph = getGraph();
let graph = getGraph();
let layoutInfo = require('./lib/getAirlinesLayout.js')(bundledGraph);
const shortestPath = require('./lib/findShortestPaths.js')
// bundledGraph = layoutInfo.graph;
// graph = layoutInfo.graph;

// for (var i = 0; i < 1; ++i) {
//   bundledGraph.forEachNode(node => {
//     layoutInfo.tighten(node.id);
//   })
// }

let nodes = [];
let edges = [];
let paths = [];
graph.forEachNode(node => {
  let pos = layoutInfo.getNodePosition(node.id)
  nodes.push({
    x: pos.x,
    y: pos.y,
    r: 1,
    id: node.id
  })
})


let findShortestPaths = shortestPath(bundledGraph)

graph.forEachLink(l => {
  let from = layoutInfo.getNodePosition(l.fromId);
  let to = layoutInfo.getNodePosition(l.toId);
  edges.push({ from, to, weight: 1 })

  let path = 'M' + point(from) + 'L' + point(to)
  paths.push(path);
  // let shortestPath = findShortestPaths(l.fromId, l.toId)
  // if (shortestPath) {
  //   let path = 'M' + point(shortestPath[0]) + shortestPath.slice(1).map(p => 'L' + point(p))
  //   paths.push(path);
  // }
})
function point(p) {
  return p.x + ',' + p.y
}

export default {
  name: 'app',
  mounted () {
    const pz = panzoom(this.$refs.scene, {
      zoomSpeed: 0.008
    })

    let scene = this.$refs.scene
  },

  data () {
    // const edges = layoutInfo.edges
    // const nodes = layoutInfo.positions
    //

    return {
      paths,
      nodes,
      edges,
    }
  },

  methods: {
    getPath (edge) {
      return `M${edge.from.x},${edge.from.y} L${edge.to.x},${edge.to.y}`
    },
    tightenAll() {
      graph.forEachNode(node => {
        layoutInfo.tighten(node.id);
      })
      this.nodes = layoutInfo.positions
      this.edges = layoutInfo.edges
    },
    getEdgeWeight(e) {
      let weightRatio = layoutInfo.getWeight(e)
      return 0.1 + 3 * weightRatio;
    },

    onMouseDown (e, n) {
      e.preventDefault()
      e.stopPropagation()
      layoutInfo.tighten(n.id);
      this.nodes = layoutInfo.positions
      this.edges = layoutInfo.edges
    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  background: RGB(240, 237, 229);
  position: absolute;
  width: 100%;
  height: 100%;
}
svg {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}
body {
  overflow: hidden;
  padding: 0;
  margin: 0;
}
.actions {
  position: absolute;
  bottom: 0;
  left: 0;
}
</style>
