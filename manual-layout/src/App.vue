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
        <g v-if='showMst'>
          <path v-for='edge in mst' :d='getPath(edge)' stroke='rgba(0, 0, 255, 1)'></path>
        </g>
        <g v-if='showNodes'>
          <rect v-for='r in rects'
                :title='r.id'
                @mousedown='onMouseDown($event, r)'
                :x='r.left' :y='r.top'
                :width='r.width'
                :height='r.height'
                :fill='getFill(r)'
                :stroke='getStroke(r)'></rect>
          <text v-for='r in rects' :x='r.left + 2' :y='r.cy' :font-size='r.fontSize'>
          {{r.id}}
          </text>
        </g>
      </g>
    </svg>
    <div class='score'>
      {{score}}
    </div>
    <div class='actions'>
      <button @click.prevent='toggleEdges'>{{(showEdges ? "Hide" : "Show") + " Edges"}}</button>
      <button @click.prevent='toggleTriangulation'>{{(showTriangulation ? "Stop" : "Start") + " overlaps removal"}}</button>
      <button @click.prevent='toggleMST'>{{(showMst ? "Hide" : "Show") + " spanning tree"}}</button>
    </div>
  </div>
</template>

<script>
const panzoom = require('panzoom')
const miserables = require('miserables')

const getScore = require('./getScore.js')
const NodeModel = require('./NodeModel.js')
const getInitialLayout = require('./getInitialLayout.js')
const EdgeModel = require('./lib/EdgeModel.js')
const removeOverlaps = require('./lib/removeOverlaps.js')

let graph = miserables
let immovable = new Set()

// import rgraph from './data/reddit-graph.js'
const positions = getInitialLayout(graph)

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

      graph.forEachLinkedNode(r.id, (other) => {
        this.idToRect.get(other.id).highlighted = true
      })
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

    toggleMST () {
      this.showMst = !this.showMst
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
      return r.highlighted ? 'rgba(0, 255, 255, 0.2)'
        : 'rgba(255, 255, 255, 0.2)'
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
      edges.push(new EdgeModel(
        idToRect.get(link.fromId),
        idToRect.get(link.toId),
      ))
    })

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

      showMst: false,
      mst: []
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
