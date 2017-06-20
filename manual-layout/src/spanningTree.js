import createGraph from 'ngraph.graph'

export default function makeSpanningTree (mstEdges) {
  const graph = createGraph()

  mstEdges.forEach(e => {
    graph.addLink(e.fromId, e.toId)
  })

  // Doesn't really matter what's root
  const rootId = mstEdges[0].fromId

  return {
    getGraph () {
      return graph
    },
    getRootId () {
      return rootId
    },
    get (id) {
      return graph.gentNode(id)
    }
  }
}
