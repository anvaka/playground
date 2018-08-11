import bookData from './data.json';
import fromJson from 'ngraph.fromjson'

let graph = fromJson(bookData);
let asins = bookData.nodes.map(node => node.data.product);

export default {
  getGraph() {
    return graph;
  },
  getAsins() {
    return asins;
  }
}