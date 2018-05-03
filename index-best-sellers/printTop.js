/**
 * This script prints top products according to my own score function.
 * 
 * Score of a product is determined by the following recursive formula:
 * 
 * score(product, layerNumber) = position_of_product_in(layerNumber) + 0.5 * score(product, layerNumber + 1)
 */
var inputFileName = process.argv[2] || 'data/books.json';

var fs = require('fs');
var es = require('event-stream');
var JSONStream = require('JSONStream');

var graph = require('ngraph.graph')();

if (!fs.existsSync(inputFileName)) {
  console.error('Please index products first with `node index.js`');
  process.exit(1);
}

readIndexedPages(inputFileName)
  .then(makeCrossReferencesForNodes)
  .then(products => {
    console.log('Top products are: ');
    console.log(JSON.stringify(products, null, 2));
  })

function makeCrossReferencesForNodes({graph, root}) {
  var productToLayer = new Map(); // maps each product to its score.
  var visitedNodes = new Set();

  assignProductScores(root, 0);
  const sortedProducts = Array.from(productToLayer)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 100);

  return sortedProducts;


  function assignProductScores(from, level) {
    var divider = 1./Math.pow(2, level);
    if (!from.data) {
      console.log(from);
      throw new Error('No data?')
    }
    if (visitedNodes.has(from.id)) {
      // some nodes may point to the same node that we've already visited
      // Right now we just ignore it, but maybe we should adjust formula for those cases.
      return;
    }
    visitedNodes.add(from.id);
    from.data.products.forEach((product, idx) => {
      mapProductTo(product, (idx + 1) * divider, from.data.parents, idx)
    });

    graph.forEachLinkedNode(from.id, (node) => {
      assignProductScores(node, level + 1);
    }, true);
  }

  function mapProductTo(product, levelRank, parents, levelIndex) {
    let {asin} = product.parsed;
    if (!asin) throw new Error('no asin?');


    let currentRecord = productToLayer.get(asin);
    if (!currentRecord) {
      currentRecord = Object.assign({
          score: levelRank,
          seenPath: makeTree(levelIndex, parents)
        }, product.parsed
      );
      productToLayer.set(asin, currentRecord);
    } else {
      currentRecord.score += levelRank;
      makeTree(levelIndex, parents, currentRecord.seenPath);
    }
  }
}

function readIndexedPages(fileName) {
  console.log('Parsing indexed pages...');

  return new Promise(resolve => {
    fs.createReadStream(fileName)
      .pipe(JSONStream.parse())
      .pipe(es.mapSync(markProcessed))
      .on('end', done);

    function markProcessed(page) {
      var foundNode = graph.getNode(page.id);
      if (foundNode && foundNode.data) {
        // means we've already added correct node here. No need
        // to duplicate again.
        return;
      }

      // nodes without data could have been added by `addLink` operation
      // So we need to add page data as well

      graph.addNode(page.id, page);
      page.children.forEach(child => {
        graph.addLink(page.id, child.href);
      });
    }

    function done() {
      var root = getRoot(graph);
      console.log('Read ' + graph.getNodesCount() + ' pages. Root is: ' + root.id);
      resolve({
        root, graph
      });
    }
  });


  function getRoot(graph) {
    // root node of a graph has no incoming links
    var root;
    graph.forEachNode(node => {
      if (!node.links) {
        throw new Error('How could there be no links?');
      }
      for (var i = 0; i < node.links.length; ++i) {
        if (node.links[i].toId === node.id) return;
      }
      // this node has no incoming links. So this is our root;
      if (root) throw new Error('How could there be two roots?');

      root = node;
    });

    return root;
  }
}

function makeTree(leafScore, parents, root = Object.create(null)) {
  var currentNode = root;
  parents.forEach(child => {
    child = child.replace(/\&amp;/g, '&');
    if (!currentNode[child]) {
      currentNode[child] = Object.create(null);
    }
    currentNode = currentNode[child]
  });
  currentNode._score = leafScore;
  return root;

}