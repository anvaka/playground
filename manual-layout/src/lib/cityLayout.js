const detectClusters = require('ngraph.louvain')
const coarsen = require('ngraph.coarsen')
const createGraph = require('ngraph.graph')
const createLayout = require('ngraph.forcelayout')
const removeOverlaps = require('./removeOverlaps.js')
const Rect = require('./rect.js')

module.exports = cityLayout

function cityLayout (graph) {
  var clusters = detectClusters(graph)
  let prevGraph = graph

  // while(clusters.canCoarse()) {
  graph = coarsen(prevGraph, clusters)
  graph.forEachNode(layoutClusterNode)

  const rects = []
  graph.forEachNode(clusterNode => {
    const sideX = clusterNode.bounds.maxX - clusterNode.bounds.minX
    const sideY = clusterNode.bounds.maxY - clusterNode.bounds.minY
    clusterNode.weight = Math.sqrt(sideX * sideY)

    // gx += sideX
    // clusterNode.rects.forEach(v => {
    //   v.cx += gx
    //   v.cy += gy
    //   rects.push(v)
    // })

    // rects.push({
    //   id: clusterNode.id + 'c',
    //   x: gx + clusterNode.bounds.minX + sideX / 2,
    //   y: gy + clusterNode.bounds.minY + sideY / 2,
    //   width: sideX,
    //   height: sideY,
    //   fontSize: 4
    // })
  })

  const layout = createLayout(graph, {
    nodeMass (nodeId) {
      return graph.getNode(nodeId).weight
    }
  })
  for (let i = 0; i < 100; ++i) {
    layout.step()
  }

  const clusterRects = new Map()
  graph.forEachNode(clusterNode => {
    const w = (clusterNode.bounds.maxX - clusterNode.bounds.minX)// * 1.5
    const h = (clusterNode.bounds.maxY - clusterNode.bounds.minY)// * 1.5

    const crect = new Rect({
      width: w,
      height: h,
      left: clusterNode.bounds.minX,
      top: clusterNode.bounds.minY
    })
    crect.id = clusterNode.id
    crect.fontSize = 4
    clusterRects.set(clusterNode.id, crect)

    rects.push(crect)
  })

  for (let i = 0; i < 10; ++i) {
    removeOverlaps(clusterRects)
  }

  graph.forEachNode(clusterNode => {
    const crect = clusterRects.get(clusterNode.id)
    const minX = clusterNode.bounds.minX
    const minY = clusterNode.bounds.minY

    clusterNode.rects.forEach(v => {
      v.cx += crect.cx - minX - crect.width / 2
      v.cy += crect.cy - minY - crect.height / 2
//      rects.push(v)
    })
  })

  rects.bounds = getBounds(rects)

  return rects
  // clusters = detectClusters(graph);
  // }

  function layoutClusterNode (node) {
    const graph = createGraph({ uniqueLinkId: false })

    node.data.forEach(x => {
      prevGraph.forEachLinkedNode(x, otherNode => {
        if (node.data.has(otherNode.id)) {
          graph.addLink(x, otherNode.id)
        }
      }, true)
    })

    addNodeWeight(graph)

    const layout = createLayout(graph, {
      nodeMass (nodeId) {
        return graph.getNode(nodeId).weight
      }
    })

    for (let i = 0; i < 200; ++i) {
      layout.step()
    }

    const rects = new Map()

    graph.forEachNode(node => {
      const pos = layout.getNodePosition(node.id)
      const side = node.weight + 5

      const r = new Rect({
        left: roundGrid(pos.x, 5),
        top: roundGrid(pos.y, 5),
        width: side,
        height: side
      })
      r.id = node.id
      r.fontSize = 4
      rects.set(node.id, r)
    })

    for (let i = 0; i < 20; ++i) {
      removeOverlaps(rects, {
        pullX: true
      })
    }

    const bounds = getBounds(rects)
    const dw = (bounds.maxX - bounds.minX) * 0.1
    const dh = (bounds.maxY - bounds.minY) * 0.1

    bounds.minX -= dw
    bounds.maxX += dw
    bounds.minY -= dh
    bounds.maxY += dh

    node.rects = rects
    node.bounds = bounds
  }
}

function getBounds (rects) {
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  rects.forEach(r => {
    const side = r.width

    if (r.cx - side / 2 < minX) minX = r.cx - side / 2
    if (r.cx + side / 2 > maxX) maxX = r.cx + side / 2

    if (r.cy - side / 2 < minY) minY = r.cy - side / 2
    if (r.cy + side / 2 > maxY) maxY = r.cy + side / 2
  })

  return { minX, minY, maxX, maxY }
}

function roundGrid (x, gridStep) {
  return Math.round(x / gridStep) * gridStep
}

function addNodeWeight (graph) {
  let sum = 0

  graph.forEachNode(node => {
    if (typeof node.data === 'number') {
      sum += node.data
    } else {
      sum += node.links.length
    }
  })

  let variance = 0
  const n = graph.getNodesCount()
  const mean = sum / n

  graph.forEachNode(node => {
    let x = node.links.length
    if (typeof node.data === 'number') {
      x = node.data
    }
    variance += (x - mean) * (x - mean)
  })

  variance /= n
  variance = Math.sqrt(variance)
  graph.forEachNode(node => {
    let x = node.links.length
    if (typeof node.data === 'number') {
      x = node.data
    }
    if (variance === 0) {
      node.weight = 3
    } else {
      node.weight = (3 + (x - mean) / variance) * 7
    }
  })
}
