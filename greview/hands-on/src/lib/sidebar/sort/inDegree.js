import centrality from 'ngraph.centrality'

export default {

  canHandle() {
    return true
  },

  getSorter(graph) {
    var inCentrality

    return {
      name: 'Popularity',
      sort: byInDegree,
      display: (x) => {
        ensureInitialized()
        return inCentrality[x.asin]
      }
    }

    function byInDegree(x, y) {
      ensureInitialized()
      return inCentrality[y.asin] - inCentrality[x.asin]
    }

    function ensureInitialized() {
      if (inCentrality) return

      inCentrality = centrality.degree(graph, 'in');
    }
  }
}
