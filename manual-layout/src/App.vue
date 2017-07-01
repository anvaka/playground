<template>
  <div id="app">
    <svg>
      <g :transform='center()' ref='scene'>
        <g v-if='showEdges'>
          <path v-for='edge in edges' :d='getPath(edge)' stroke='rgba(0, 0, 0, 0.2)'></path>
        </g>
        <g v-if='showTriangulation'>
          <path v-for='triangle in triangulation' :d='triangle.getPath()' stroke='rgba(255, 0, 0, 0.2)' fill='transparent'></path>
        </g>
        <!--path :d='vor' stroke='rgba(0, 0, 255, 1)' fill='transparent'></path-->
        <!--path :d='del' stroke='rgba(0, 255, 0, 1)' fill='transparent'></path-->

        <g v-if='showNodes'>
           <!--circle v-for='r in rects'
           :cx='r.cx'
       :fill='getFill(r)'
                @mousedown='onMouseDown($event, r)'
       :stroke='getStroke(r)'
           :cy='r.cy'
       :r='r.width/2'>
           </circle-->
          <rect v-for='r in rects'
                :title='r.id'
                @mousedown='onMouseDown($event, r)'
                :x='r.left' :y='r.top'
                :width='r.width'
                :height='r.height'
                :fill='getFill(r)'
                :stroke='getStroke(r)'></rect>
          <!--text v-for='r in rects' :x='r.left + 2' :y='r.cy' :font-size='r.fontSize'>
          {{r.id}}
          </text-->
        </g>
      </g>
    </svg>
    <div class='score'>
      {{score}}
    </div>
    <div class='actions'>
      <button @click.prevent='toggleEdges'>{{(showEdges ? "Hide" : "Show") + " Edges"}}</button>
      <button @click.prevent='toggleTriangulation'>{{(showTriangulation ? "Stop" : "Start") + " overlaps removal"}}</button>
    </div>
  </div>
</template>

<script>
const panzoom = require('panzoom')
const miserables = require('miserables')
// const anvakaGraph = require('./data/socialGraph.js')

const centrality = require('ngraph.centrality')
const getScore = require('./getScore.js')
const NodeModel = require('./NodeModel.js')
const getInitialLayout = require('./getInitialLayout.js')
// const cityLayout = require('./lib/cityLayout.js')
const EdgeModel = require('./lib/EdgeModel.js')
const removeOverlaps = require('./lib/removeOverlaps.js')
const computeVoronoiDetails = require('./lib/computeVoronoiDetails.js')
const findShortestPaths = require('./lib/findShortestPaths')

let graph = miserables
let betweenness = centrality.betweenness(graph)
let immovable = new Set()
let positions = getInitialLayout(graph)
let voronoiDetails = computeVoronoiDetails(positions)

let maxValue = 0
Object.keys(betweenness).forEach(k => {
  let v = betweenness[k]
  if (v > maxValue) maxValue = v
})

let weights = []
graph.forEachLink(l => {
  let fromLinks = graph.getNode(l.fromId).links.length
  let toLinks = graph.getNode(l.toId).links.length
  l.weight = betweenness[l.fromId] / fromLinks * betweenness[l.toId] / toLinks
  weights.push(l.weight)
})

console.log(weights)

module.exports = {
  name: 'app',
  mounted () {
    panzoom(this.$refs.scene)
  },

  methods: {
    highlightDependencies (r) {
      this.rects.forEach(r => {
        r.highlighted = false
      })

      let voronoiGraph = voronoiDetails.graph
      let tesselation = voronoiGraph.parentLookup

      let allPaths = ''
      graph.forEachLink(l => {
        let fromTIds = tesselation.get(l.fromId)
        let toTIds = tesselation.get(l.toId)
        let shortestPath = findShortestPaths(voronoiGraph, fromTIds, toTIds)
        allPaths += ' M' + shortestPath[0] + ' ' + shortestPath.slice(1).join(' L')
      })

      // let fromTIds = tesselation.get(r.id)
      // graph.forEachLinkedNode(r.id, (other) => {
      //   this.idToRect.get(other.id).highlighted = true
      //   let toTIds = tesselation.get(other.id)
      //   let shortestPath = findShortestPaths(voronoiGraph, fromTIds, toTIds)
      //   allPaths += ' M' + shortestPath[0] + ' ' + shortestPath.slice(1).join(' L')
      // })
      this.del = allPaths
    },

    getPath (edge) {
      return `M${edge.from.cx},${edge.from.cy} L${edge.to.cx},${edge.to.cy}`
    },

    center () {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      return `translate(${cx}, ${cy})`
    },

    toggleEdges () {
      this.showEdges = !this.showEdges
    },

    toggleTriangulation () {
      this.showTriangulation = !this.showTriangulation
      for (let i = 0; i < 200; ++i) {
        this.recomputeTriangulation()
      }
    },

    recomputeTriangulation () {
      if (!this.showTriangulation) return

      removeOverlaps(this.idToRect, {
        canMove (nodeId) {
          return !immovable.has(nodeId)
        }
      })
    },

    getStroke (r) {
      return r.selected ? 'orange' : 'black'
    },

    getFill (r) {
      let opacity = betweenness[r.id] / maxValue
      return 'rgba(0, 255, 255, ' + opacity + ')'
      // return r.highlighted ? 'rgba(0, 255, 255, 0.2)'
      //   : 'rgba(255, 255, 255, 0.2)'
    },

    onMouseDown (e, r) {
      e.preventDefault()
      e.stopPropagation()

      if (!r.selected) {
        if (e.shiftKey) {
          this.selected.push(r)
        } else {
          this.selected = [r]

          immovable = new Set()
          this.rects.forEach(r => {
            r.selected = false
          })
        }
        immovable.add(r.id)
        r.selected = true
      }

      this.highlightDependencies(r)

      let x = e.clientX
      let y = e.clientY
      let self = this

      window.addEventListener('mouseup', handleMouseUp, true)
      window.addEventListener('mousemove', handleMouseMove, true)

      function handleMouseUp (e) {
        window.removeEventListener('mouseup', handleMouseUp, true)
        window.removeEventListener('mousemove', handleMouseMove, true)
      }

      function handleMouseMove (e) {
        const dy = e.clientY - y
        const dx = e.clientX - x

        self.selected.forEach(r => {
          r.cy += dy
          r.cx += dx
        })

        x = e.clientX
        y = e.clientY

        self.score = Math.round(getScore(graph, self.idToRect).distance)
        self.recomputeTriangulation()
      }
    }
  },

  data () {
    const rects = []
    const idToRect = new Map()
    const edges = []

    positions.forEach(pos => {
      const r = new NodeModel(pos)
      rects.push(r)
      idToRect.set(r.id, r)
    })

    graph.forEachLink(link => {
      if (link.weight >= 0) {
        edges.push(new EdgeModel(
          idToRect.get(link.fromId),
          idToRect.get(link.toId),
        ))
      }
    })

//    voronoiDetails.graph.forEachNode(n => {
//      const r = new NodeModel({
//        id: n.id,
//        cx: n.data.pos[0],
//        cy: n.data.pos[1],
//        width: 2,
//        height: 2,
//        fontSize: 1
//      })
//      rects.push(r)
//    })

    return {
      idToRect,
      score: 'N/A',
      selected: [],

      showEdges: false,
      edges,

      showNodes: true,
      rects,

      showTriangulation: false,
      triangulation: [],

      vor: voronoiDetails.polygonsPath,
      del: voronoiDetails.delaunayPath
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
  margin-top: 60px;
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
.score {
  position: absolute;
  right: 0;
  top: 0;
}
.actions {
  position: absolute;
  bottom: 0;
}
</style>
