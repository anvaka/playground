import pagerank from 'ngraph.pagerank'

export default {

  canHandle() {
    return true
  },

  getSorter(graph) {
    var rank

    return {
      name: 'PageRank',
      sort: byRank,
      display: (x) => {
        ensureInitalized()
        return rank[x.asin]
      }
    }

    function byRank(x, y) {
      ensureInitalized()
      return rank[y.asin] - rank[x.asin]
    }

    function ensureInitalized() {
      if (rank) return

      rank = pagerank(graph)
    }
  }
}
