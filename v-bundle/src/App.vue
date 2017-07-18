<template>
  <div id="app">
    <svg>
      <g ref='scene'>
        <g v-if='showGraphEdges'>
          <path v-for='edge in edges' :d='getPath(edge)' stroke='rgba(90, 90, 90, 0.1)' :stroke-width='0.4'></path>
        </g>
        <g v-if='showAllVoronoiCells'>
          <path :d='allVoronoiCells' stroke='rgba(00, 00, 180, 0.5)' :stroke-width='0.4'></path>
        </g>
        <g v-if='showAllDelaunay'>
          <path v-for='edge in delaunay' :d='getPath(edge)' stroke='rgba(180, 00, 00, 0.5)' :stroke-width='0.4'></path>
        </g>

        <g v-if='showVoronoiGraphNodes'>
          <path v-for='edge in voronoiEdges' :d='getPath(edge)' stroke='rgba(0, 218, 97, 1)' :stroke-width='0.4'></path>
          <circle v-for='r in voronoiNodes'
              :key='r.id'
              :cx='r.x'
              fill='RGB(0, 218, 97)'
              stroke='RGB(0, 218, 97)'
              @mousedown='onMouseDown($event, r)'
              :cy='r.y' :r='0.2'></circle>
        </g>

        <path :d='shortestPathVoronoiCells' stroke='rgba(00, 200, 0, 1)' :stroke-width='0.4' fill='transparent'></path>
        <path v-for='route in shortestPath'
            :d='route.getPath()' stroke='rgba(10, 10, 10, 0.5)' :stroke-width='route.getWidth()' fill='transparent'></path>

        <g v-if='showGraphNodes'>
          <circle v-for='r in nodes'
              :key='r.id'
              :cx='r.x'
              fill='RGB(218, 97, 97)'
              stroke='RGB(218, 97, 97)'
              @mousedown='onMouseDown($event, r)'
              :cy='r.y' :r='r.r'></circle>
        </g>
      </g>
    </svg>
  <div class='actions'>
    <a href='#' @click.prevet='showGraphEdges = !showGraphEdges'>Toggle edges</a>
    <a href='#' @click.prevet='showGraphNodes = !showGraphNodes'>Toggle nodes</a>
    <a href='#' @click.prevet='showAllVoronoiCells = !showAllVoronoiCells'>Toggle voronoi</a>
    <a href='#' @click.prevet='showAllDelaunay = !showAllDelaunay'>Toggle Delaunay</a>
    <a href='#' @click.prevet='showVoronoiGraphNodes = !showVoronoiGraphNodes'>Toggle Voronoi Graph</a>
  </div>
  </div>
</template>

<script>
const panzoom = require('panzoom')
const getGraph = require('./data/airlinesGraph.js')
const graph = getGraph();
const layoutInfo = require('./lib/getAirlinesLayout.js')(graph);
const voronoiGraph = require('./lib/getVoronoiGraph.js')(layoutInfo, graph);
const linkRenderer = require('./lib/linkRenderer.js')();
let nodes = [];
let edges = [];

graph.forEachNode(node => {
  let pos = layoutInfo.getNodePosition(node.id)
  nodes.push({
    x: pos.x,
    y: pos.y,
    r: 1,
    id: node.id
  })
})


graph.forEachLink(l => {
  let from = layoutInfo.getNodePosition(l.fromId);
  let to = layoutInfo.getNodePosition(l.toId);
  edges.push({ from, to, weight: 1 })
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
    const allVoronoiCells = voronoiGraph.getCells();
    const delaunay = voronoiGraph.getDelaunay();
    const voronoiGraphGeometry = voronoiGraph.getVoronoiGraphGeometry();

    return {
      showGraphEdges: false,
      showGraphNodes: true,
      showAllVoronoiCells: false,
			showAllDelaunay: false,
      showVoronoiGraphNodes: false,
      voronoiNodes: voronoiGraphGeometry.nodes,
      voronoiEdges: voronoiGraphGeometry.edges,
      shortestPathVoronoiCells: '',
      shortestPath: [],
      allVoronoiCells,
      delaunay,
      nodes,
      edges,
    }
  },

  methods: {
    getPath (edge) {
      return `M${edge.from.x},${edge.from.y} L${edge.to.x},${edge.to.y}`
    },
    onMouseDown (e, n) {
      let shortesPaths = []
      let cellPath = [];

      linkRenderer.reset();
      graph.forEachLink((l) => {
        const route = voronoiGraph.collectRoute(l.fromId, l.toId);
//       graph.forEachLinkedNode(n.id, (other) => {
//         const route = voronoiGraph.collectRoute(n.id, other.id);
//        shortesPaths.push(route.edgePath)
//        shortesPaths.push(route.cellPath)
        shortesPaths.push(route.shortestPath);
        cellPath.push(route.cellPath);
        const {shortestPathAsIs} = route;
        shortestPathAsIs.forEach((pt, idx) => {
          if (idx > 0) linkRenderer.draw(shortestPathAsIs[idx - 1], shortestPathAsIs[idx])
        });
      })

      // this.shortestPathVoronoiCells = cellPath.join(' ');
      this.shortestPath = linkRenderer.getRoutes();
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
