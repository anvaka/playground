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
        <path v-for='p in voronoiPaths' :d='p.d' :stroke-width='p.width' stroke='RGB(234, 183, 114)' fill='transparent'></path>

        <g v-if='showNodes'>
           <circle v-for='r in rects'
                :key='r.id'
                v-if='r.visible'
                :cx='r.cx'
                fill='RGB(218, 97, 97)'
                stroke='RGB(218, 97, 97)'
                @mousedown='onMouseDown($event, r)'
                :cy='r.cy' :r='r.width/2'>
           </circle>
          <!--rect v-for='r in rects'
                v-if='r.visible'
                :title='r.id'
                @mousedown='onMouseDown($event, r)'
                :x='r.left' :y='r.top'
                :width='r.width'
                :height='r.height'
                :fill='getFill(r)'
                :stroke='getStroke(r)'></rect-->
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
const anvakaGraph = require('./data/socialGraph.js')

const centrality = require('ngraph.centrality')
const pagerank = require('ngraph.pagerank')
const getScore = require('./getScore.js')
const NodeModel = require('./NodeModel.js')
const getInitialLayout = require('./getInitialLayout.js')
// const cityLayout = require('./lib/cityLayout.js')
const EdgeModel = require('./lib/EdgeModel.js')
const removeOverlaps = require('./lib/removeOverlaps.js')
const computeVoronoiDetails = require('./lib/computeVoronoiDetails.js')
const shortestPath = require('./lib/findShortestPaths.js')

let graph = anvakaGraph; //miserables
let rank = pagerank(graph)

let immovable = new Set()
let layoutInfo = getInitialLayout(graph)
let positions = layoutInfo.positions
let layout = layoutInfo.layout

const rects = []
const idToRect = new Map()
positions.forEach(pos => {
  const r = new NodeModel(pos)
  r.visible = true
  rects.push(r)
  idToRect.set(r.id, r)
})
for (let i = 0; i < 20; ++i) removeOverlaps(idToRect)

let voronoiDetails = computeVoronoiDetails(positions)

let maxValue = 0

let flatLinks = []
let minLinkWeight = Number.POSITIVE_INFINITY
let maxLinkWeight = Number.NEGATIVE_INFINITY

graph.forEachLink(l => {
  let fromRank = rank[l.fromId]
  let toRank = rank[l.toId]
  let weight = (fromRank + toRank)/2
  if (weight < minLinkWeight) minLinkWeight = weight
  if (weight > maxLinkWeight) maxLinkWeight = weight

  l.data = { weight }
  flatLinks.push(l)
})

flatLinks.sort((a, b) => {
  return b.data.weight - a.data.weight
})

let flatNodes = []

let minNodeWeight = Number.POSITIVE_INFINITY
let maxNodeWeight = Number.NEGATIVE_INFINITY
graph.forEachNode(n => {
  n.rank = rank[n.id]
  if (n.rank < minNodeWeight) minNodeWeight = n.rank
  if (n.rank > maxNodeWeight) maxNodeWeight = n.rank
  flatNodes.push(n)
})

flatNodes.sort((a, b) => b.rank - a.rank)

let voronoiGraph = voronoiDetails.graph
let findShortestPaths = shortestPath(voronoiGraph)
let tesselation = voronoiGraph.parentLookup
let voronoiLinks = new Map() // linkId => link shortest path on voronoi tesslation

console.time('Shortest paths')
graph.forEachLink(l => {
  let fromTIds = tesselation.get(l.fromId)
  let toTIds = tesselation.get(l.toId)
  let shortestPath = findShortestPaths(fromTIds, toTIds)
  voronoiLinks.set(getLinkId(l), shortestPath)
})
console.timeEnd('Shortest paths')

function getLinkId (l) {
  return '' + l.fromId + ';' + l.toId
}

function getLinkPath (l, topLeft, bottomRight) {
  const linkId = getLinkId(l)
  const shortestPath = voronoiLinks.get(linkId)
  if (shortestPath) {
    let start = layout.getNodePosition(l.fromId)
    let end = layout.getNodePosition(l.toId)
    let points = shortestPath.map(p => {
      let pair = p.split(',')
      return {
        x: pair[0],
        y: pair[1]
      }
    })

    points.unshift(end);
    points.push(start);

    let newPaths = points.filter(insideRect)
    if (newPaths.length > 1) {
      return 'M' + newPaths[0].x + ',' + newPaths[0].y + ' ' +
          points.slice(1).map(p => ' L' + p.x + ',' + p.y)
    }
  }

  return ''

  function insideRect(p) {
    return p.x >= topLeft.x && p.x <= bottomRight.x && p.y >= topLeft.y && p.y <= bottomRight.y
  }
}

console.log('done')

module.exports = {
  name: 'app',
  mounted () {
    const pz = panzoom(this.$refs.scene, {
      zoomSpeed: 0.008
    })

    let scene = this.$refs.scene
    let topLeft = scene.ownerSVGElement.createSVGPoint()
    let bottomRight = scene.ownerSVGElement.createSVGPoint()

    scene.addEventListener('zoom', e => {
      let t = pz.getTransform().scale
      topLeft.x = 0;
      topLeft.y = 0;
      bottomRight.x = window.innerWidth
      bottomRight.y = window.innerHeight
      let inv = scene.getScreenCTM().inverse();
      this.updateVisibleEdges(t, topLeft.matrixTransform(inv), bottomRight.matrixTransform(inv))
    })
  },

  methods: {
    updateVisibleEdges (zoomLevel, topLeft, bottomRight) {
      let linksCount = flatLinks.length
      let sliceSize = Math.min(Math.round(linksCount * zoomLevel / 4), linksCount)

      let z = zoomLevel
      if (zoomLevel < 1) {
        z = -1/zoomLevel
      }
      z = Math.min(Math.max(-4, z), 4)
      let visibleBin = 10 - Math.round(10 * (z + 4)/8)

      let edges = []
      let paths = []
      let binsCount = 10
      let bandsCount = 4
      let bandSize = Math.floor(linksCount / bandsCount)
      for (let i = 0; i < linksCount; ++i) {
        let l = flatLinks[i]
        let linkBand = Math.floor(i / bandSize)
        let linkBin = Math.round(10 * (l.data.weight - minLinkWeight)/(maxLinkWeight - minLinkWeight))

        if (linkBin >= visibleBin) {
          let d = getLinkPath(l, topLeft, bottomRight);
          if (d) {
            paths.push({
              d,
              width: 1.5 / Math.pow(2, linkBand)
            })
          }
        }
      }

      this.voronoiPaths = paths

      let nodeCount = flatNodes.length
      let nodeSliceSize = Math.min(Math.round(nodeCount * zoomLevel / 4), nodeCount)
      let lastVisibleRank = flatNodes[nodeSliceSize - 1].rank
      for (let i = 0; i < this.rects.length; ++i) {
        let r = this.rects[i]
        let nodeRank = graph.getNode(r.id).rank
        let nodeBin = Math.round(10 * (nodeRank - minNodeWeight)/(maxNodeWeight - minNodeWeight))
        // r.visible = nodeRank >= lastVisibleRank
        r.visible = (nodeBin >= visibleBin) && (
          r.cx >= topLeft.x && r.cx <= bottomRight.x && r.cy >= topLeft.y && r.cy <= bottomRight.y
        )
      }
    },

    highlightDependencies (r) {
      this.rects.forEach(r => { r.highlighted = false })
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
      return 'RGB(176, 52, 113)'
      // return 'rgba(0, 255, 255, 1)'
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
    const edges = []

    graph.forEachLink(link => {
      edges.push(new EdgeModel(
        idToRect.get(link.fromId),
        idToRect.get(link.toId),
      ))
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
      del: voronoiDetails.delaunayPath,
      voronoiPaths: []
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
