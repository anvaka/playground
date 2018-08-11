import formatNumber from '../../formatNumber.js'
import find from '../find.js'

export default {
  canHandle(items) {
    return find(items, getPage)
  },

  getSorter() {
    return {
      name: 'Number of Pages',
      sort: byPageCount,
      display: (x) => {
        let value = getPage(x)
        if (value !== undefined) return formatNumber(value)
        return 'N/A'
      }
    }
  }
}

function getPage(x) {
  return x.attributes.NumberOfPages
}

function byPageCount(x, y) {
  let xPage = getPage(x)
  let yPage = getPage(y)

  if (xPage && yPage) return xPage - yPage

  // both are 0
  if (xPage == yPage) return 0 // eslint-disable-line

  return xPage ? -1 : 1
}
