import bookData from '../data/data.json';
import fromJson from 'ngraph.fromjson'

let graph = fromJson(bookData);
let asinLookup = new Map();
let asins = [];

bookData.nodes.forEach(node => {
  const product = node.data.product;
  asins.push(product);
  asinLookup.set(product.asin, product);
});

const graphStore = makeGraphStore();

export default graphStore

function makeGraphStore() {
  const data = {
    tooltip: null,
    getGraph() {
      return graph;
    },
    getAsins() {
      return asins;
    },
    getAsin(asin) {
      return asinLookup.get(asin);
    },
    setTooltip
  }

  return data;

  function setTooltip(asin, position) {
    if (asin) {
      let item = asinLookup.get(asin)

      data.tooltip = {
        asin: item.asin,
        title: item.title,
        img: item.image.URL,
        pos: position
      }
    } else {
      data.tooltip = null
    }
  }
}