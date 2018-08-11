import formatNumber from '../../formatNumber.js'

export default {
  canHandle() {
    return true
  },

  getSorter() {
    return {
      name: 'Sales Rank',
      sort: bySalesRank,
      display: (x) => {
        if (x.salesRank) return formatNumber(x.salesRank)
        return 'N/A'
      }
    }
  }
}

function bySalesRank(x, y) {
  if (x.salesRank && y.salesRank) return x.salesRank - y.salesRank

  // both are 0
  if (x.salesRank === y.salesRank) return 0

  return (x.salesRank === 0) ? 1 : -1
}
