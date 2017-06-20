<template>
  <div id="app">
    <svg>
      <g :transform='center()' ref='scene'>
        <g v-if='showEdges'>
          <path v-for='edge in edges' :d='edge.getPath()' stroke='rgba(0, 0, 0, 0.2)'></path>
        </g>
        <!--g v-if='showTriangulation'>
          <path v-for='triangle in triangulation' :d='triangle.getPath()' stroke='rgba(255, 0, 0, 0.2)' fill='transparent'></path>
        </g-->
        <g v-if='showMst'>
          <path v-for='edge in mst' :d='edge.getPath()' stroke='rgba(0, 0, 255, 1)'></path>
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
      <button @click.prevent='toggleTriangulation'>{{(showTriangulation ? "Hide" : "Show") + " Triangulation"}}</button>
      <button @click.prevent='toggleMST'>{{(showMst ? "Hide" : "Show") + " spanning tree"}}</button>
    </div>
  </div>
</template>

<script>
import Delaunay from 'delaunay-fast'
import panzoom from 'panzoom'
import createGraph from 'ngraph.graph'
import findMinimumSpanningTree from 'ngraph.kruskal'

import getScore from './getScore.js'
import NodeModel from './NodeModel.js'
import EdgeModel from './EdgeModel.js'
import TriangleModel from './TriangleModel.js'
import graph from './data/rprogramming.js'
// import graph from 'miserables'
import getInitialLayout from './getInitialLayout.js'
import makeSpanningTree from './spanningTree.js'

let immovable = new Set()

// const graph = createGraph()
// graph.addLink(1, 2)
// graph.addLink(1, 3)
const positions = getInitialLayout(graph)
// positions[0].x = 20
// positions[0].y = 0
// positions[0].width = 10
// positions[0].height = 10
// positions[1].x = 10
// positions[1].y = 20
// positions[1].width = 10
// positions[1].height = 10
// positions[2].x = 0
// positions[2].y = 20
// positions[2].width = 20
// positions[2].height = 20

export default {
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
      this.recomputeTriangulation()
    },

    recomputeTriangulation () {
      if (!this.showTriangulation) return

      const triangulation = []
      const vertices = this.rects.map(r => {
        const pair = [r.cx, r.cy]
        pair.id = r.id
        return pair
      })

      const triangles = Delaunay.triangulate(vertices)
      const triangulationGraph = createGraph({ uniqueLinkId: false })

      for (let i = triangles.length; i;) {
        --i
        const first = vertices[triangles[i]]
        const p0 = [ first[0], first[1] ]
        --i
        const second = vertices[triangles[i]]
        const p1 = [ second[0], second[1] ]
        --i
        const third = vertices[triangles[i]]
        const p2 = [ third[0], third[1] ]
        const node = new TriangleModel(p0, p1, p2)
        triangulation.push(node)

        this.addTriangulationLink(first.id, second.id, triangulationGraph)
        this.addTriangulationLink(second.id, third.id, triangulationGraph)
        this.addTriangulationLink(third.id, first.id, triangulationGraph)
      }

      const mst = findMinimumSpanningTree(triangulationGraph, e => e.data)

      this.mst = mst.map(edge => new EdgeModel(
        this.idToRect.get(edge.fromId),
        this.idToRect.get(edge.toId))
      )

      const tree = makeSpanningTree(mst)
      grow(tree, this.idToRect)

      this.triangulation = triangulation
    },

    addTriangulationLink (fromId, toId, tGraph) {
      const from = this.idToRect.get(fromId)
      const to = this.idToRect.get(toId)
      const weight = getTriangulationWeight(from, to)

      tGraph.addLink(fromId, toId, weight)
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

function getTriangulationWeight (a, b) {
  if (overlaps(a, b)) {
    const centerDistance = getPointDistance(a, b)
    const t = getOverlapFactor(a, b)
    return -(t - 1) * centerDistance
  }

  return getRectangularDistance(a, b)
}

function overlaps (a, b) {
  // If one rectangle is on left side of other
  // NOTE: This gives funny results when we always return true
  if (a.left > b.right || b.left > a.right) return false

  // If one rectangle is above other
  if (a.top > b.bottom || b.top > a.bottom) return false

  return true
}

function getRectangularDistance (a, b) {
  if (overlaps(a, b)) return 0
  let dx = 0
  let dy = 0

  if (a.right < b.left) {
    dx = b.right - a.left
  } else if (b.right < a.left) {
    dx = a.left - b.right
  }

  if (a.top < b.bottom) {
    dy = b.bottom - a.top
  } else if (b.top < a.bottom) {
    dy = a.bottom - b.top
  }

  return Math.sqrt(dx * dx + dy * dy)
}

function getPointDistance (a, b) {
  const dx = a.cx - b.cx
  const dy = a.cy - b.cy

  return Math.sqrt(dx * dx + dy * dy)
}

function getOverlapFactor (a, b) {
  const dx = Math.abs(a.cx - b.cx)
  const dy = Math.abs(a.cy - b.cy)

  const wx = (a.width + b.width) / 2
  const wy = (a.height + b.height) / 2

  const t = Math.min(wx / dx, wy / dy)
  return t
}

function grow (tree, idToRect) {
  const graph = tree.getGraph()

  const processed = new Set()
  growAt(tree.getRootId())

  function growAt (nodeId) {
    if (processed.has(nodeId)) return

    processed.add(nodeId)

    const rootPos = idToRect.get(nodeId)

    graph.forEachLinkedNode(nodeId, otherNode => {
      if (processed.has(otherNode.id)) return

      const childPos = idToRect.get(otherNode.id)
      if (overlaps(rootPos, childPos)) {
        const t = getOverlapFactor(rootPos, childPos)
        const dx = (childPos.cx - rootPos.cx)
        const dy = (childPos.cy - rootPos.cy)

        if (immovable.has(otherNode.id)) {
          rootPos.cx = childPos.cx - t * dx
          rootPos.cy = childPos.cy - t * dy
        } else {
          childPos.cx = rootPos.cx + t * dx
          childPos.cy = rootPos.cy + t * dy
        }
      }
      growAt(otherNode.id)
    })
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
