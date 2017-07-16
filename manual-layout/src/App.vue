<template>
  <div id="app">
    <svg>
      <g :transform='center()' ref='scene'>
        <g v-if='showEdges'>
          <path v-for='edge in edges' :d='getPath(edge)' stroke='rgba(234, 183, 114, 0.5)'></path>
        </g>
        <g v-if='showTriangulation'>
          <path v-for='triangle in triangulation' :d='triangle.getPath()' stroke='rgba(255, 0, 0, 0.2)' fill='transparent'></path>
        </g>
        <path :d='vor' stroke='rgba(255, 0, 0, 0.4)' fill='transparent' stroke-width='0.65'></path>
        <path :d='del' stroke='rgba(0, 0, 255, 0.4)' fill='transparent'></path>
        <path v-for='p in voronoiPaths' :d='p.d' :stroke-width='p.width' stroke='RGB(234, 183, 114)' fill='transparent'></path>

        <g v-if='showNodes'>
           <!--circle v-for='r in rects'
                :key='r.id'
                v-if='r.visible'
                :cx='r.cx'
                fill='RGB(218, 97, 97)'
                stroke='RGB(218, 97, 97)'
                @mousedown='onMouseDown($event, r)'
                :cy='r.cy' :r='r.width/4'>
           </circle-->
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
const airlines = require('./data/airlinesGraph.js')

const centrality = require('ngraph.centrality')
const pagerank = require('ngraph.pagerank')
const getScore = require('./getScore.js')
const NodeModel = require('./NodeModel.js')
// const cityLayout = require('./lib/cityLayout.js')
const EdgeModel = require('./lib/EdgeModel.js')
const removeOverlaps = require('./lib/removeOverlaps.js')
const computeVoronoiDetails = require('./lib/computeVoronoiDetails.js')
const getVoronoiPath = require('./lib/voronoiPaths.js');
const smoothPath = require('./lib/smoothPath.js');
const random = require('ngraph.random').random(42)

const voronoi = require('d3-voronoi').voronoi
const createGraph = require('ngraph.graph')

let useAirlines = true;
let graph = airlines; //  miserables
let layoutInfo

if (useAirlines) {
  graph = airlines
  layoutInfo = require('./lib/getAirlinesLayout.js')(graph);
} else {
  const getInitialLayout = require('./getInitialLayout.js')
  layoutInfo = getInitialLayout(graph)
}

let rank = pagerank(graph)
let immovable = new Set()
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

function convertPositionsToVoronoiPoints (positions) {
  let points = []

  positions.forEach(p => {
    let dw = p.width * 0.25
    let dh = p.height * 0.25
   // points.push({
   //   cx: p.cx,
   //   cy: p.cy,
   //   id: p.id
   // });
   // return;
    points.push(
      {
        id: p.id,
        cx: p.cx,
        cy: p.cy
      },
      // {
      //   id: p.id,
      //   cx: p.left,
      //   cy: p.top
      // }, {
      //   id: p.id,
      //   cx: p.right,
      //   cy: p.top
      // }, {
      //   id: p.id,
      //   cx: p.right,
      //   cy: p.bottom
      // }, {
      //   id: p.id,
      //   cx: p.left,
      //   cy: p.bottom
      // },
      {
        id: p.id,
        cx: p.left - dw,
        cy: p.top - dh
      }, {
        id: p.id,
        cx: p.right + dw,
        cy: p.top - dh
      }, {
        id: p.id,
        cx: p.right + dw,
        cy: p.bottom + dh
      }, {
        id: p.id,
        cx: p.left - dw,
        cy: p.bottom + dh
      }
    )
  })

  return points
}
const v = voronoi()
  .x(r => r.cx)
  .y(r => r.cy)
  .extent([[positions.bounds.minX, positions.bounds.minY], [
    positions.bounds.maxX,
    positions.bounds.maxY
  ]])


function uniform(min, max) {
  return random.nextDouble()* (max - min) + min;
  //return Math.random() * (max - min) + min;
}

function gaussian(mu, sigma) {
    // use the polar form of the Box-Muller transform
    let r, x, y;
    do {
        x = uniform(-1.0, 1.0);
        y = uniform(-1.0, 1.0);
        r = x*x + y*y;
    } while (r >= 1 || r === 0);
    return mu + sigma * x * Math.sqrt(-2 * Math.log(r) / r);

    // Remark:  y * Math.sqrt(-2 * Math.log(r) / r)
    // is an independent random gaussian
}

const corners = convertPositionsToVoronoiPoints(positions)
let computed = v(corners)
let vor = computed.edges.map(x => edgePath(x)).join(' ')

function addNoise(x0, y0, x1, y1, v, n, out) {
  let start = [x0, y0]
  let end = [x1, y1]

  let dx = x1 - x0
  let dy = y1 - y0
  let l = Math.sqrt(dx * dx + dy * dy)

  var variance = l * 0.5
  var xmid = 0.5 * (x0 + x1) + gaussian(0, Math.sqrt(variance));
  var ymid = 0.5 * (y0 + y1) + gaussian(0, Math.sqrt(variance));

  if (n > 1 && l > 15) {
    addNoise(x0, y0, xmid, ymid, v/2, n - 1, out)
    addNoise(xmid, ymid, x1, y1, v/2, n - 1, out)
  } else {
    out.push(start, [xmid, ymid], end)
  }
}

function edgePath(e) {
  let x0 = e[0][0]
  let x1 = e[1][0]
  let y0 = e[0][1]
  let y1 = e[1][1]
  let points = []

  let dx = x1 - x0
  let dy = y1 - y0
  let l = Math.sqrt(dx * dx + dy * dy)

  var variance = l * 0.2
  addNoise(x0, y0, x1, y1, variance, 4, points)

  let newPoints = points.map(p => ({
    x: p[0],
    y: p[1]
  }));

  // return smoothPath(newPoints)
  // return 'M' + point(points[0]) + points.slice(1).map(p => 'L' + point(p));
  return 'M' + point(e[0]) + 'L' + point(e[1]);
}

let del = computed.links().map(l => {
  return 'M' + point([l.source.cx, l.source.cy]) + 'L' + point([l.target.cx, l.target.cy])
}).join('');
del = '';

function point(p) {
  return p[0] + ',' + p[1]
}

// let voronoiDetails = computeVoronoiDetails(positions)

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

// let voronoiGraph = voronoiDetails.graph
let voronoiLinks = null; // getVoronoiPath(voronoiGraph, graph)

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

    let newPaths = points.map(p => ({
      x: Number.parseFloat(p.x),
      y: Number.parseFloat(p.y)
    })); //points.filter(insideRect)

    if (newPaths.length > 1) {
      return smoothPath(newPaths);
      // return 'M' + newPaths[0].x + ',' + newPaths[0].y + ' ' +
      //     newPaths.slice(1).map(p => ' L' + p.x + ',' + p.y)
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
      return;

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

        // if (linkBin >= visibleBin) {
          let d = getLinkPath(l, topLeft, bottomRight);
          if (d) {
            paths.push({
              d,
              width: 1.5 / Math.pow(2, linkBand)
            })
          }
        // }
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
        r.visible = true
          // (nodeBin >= visibleBin) && (
          // r.cx >= topLeft.x && r.cx <= bottomRight.x && r.cy >= topLeft.y && r.cy <= bottomRight.y
        // )
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

      // vor: voronoiDetails.polygonsPath,
//      del: voronoiDetails.delaunayPath,
      del: del,
      vor: vor,
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
