<template>
  <div id="app">
    <svg>
      <g ref='scene'>
        <path v-for='edge in edges' :d='getPath(edge)' stroke='rgba(234, 183, 114, 0.5)'></path>
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
  </div>
</template>

<script>
const panzoom = require('panzoom')
const airlines = require('./data/airlinesGraph.js')
let graph = airlines;
let layoutInfo = require('./lib/getAirlinesLayout.js')(graph);

export default {
  name: 'app',
  mounted () {
    const pz = panzoom(this.$refs.scene, {
      zoomSpeed: 0.008
    })

    let scene = this.$refs.scene
  },

  data () {
    const edges = layoutInfo.edges
    const nodes = layoutInfo.positions


    return {
      edges,
      nodes,
    }
  },

  methods: {
    getPath (edge) {
      return `M${edge.from.x},${edge.from.y} L${edge.to.x},${edge.to.y}`
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
</style>
