import find from '../find.js'

export default {
  canHandle(items) {
    return find(items, getDate)
  },

  getSorter() {
    return {
      name: 'Publication Date',
      sort: byPublicationDate,
      display: (x) => {
        return getDate(x) || 'N/A'
      }
    }
  }
}

function getDate(x) {
  return x.attributes.PublicationDate
}

function byPublicationDate(x, y) {
  let xPub = getDate(x)
  let yPub = getDate(y)
  if (xPub && yPub) return yPub.localeCompare(xPub)

  // both are ''
  if (xPub == yPub) return 0 // eslint-disable-line

  return xPub ? -1 : 1
}
