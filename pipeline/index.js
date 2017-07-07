let pipeline = require('./lib/pipeline');
let readGraph = require('./lib/steps/readGraph.js');
let runLayout = require('./lib/steps/runLayout.js');
let getLayoutDimensions = require('./lib/steps/getLayoutDimensions.js');
let detectClusters = require('./lib/steps/detectClusters.js');

const graphFileName = process.argv[2] || __dirname + '/../manual-layout/src/data/anvaka.json';

if (!graphFileName) {
  console.error('Graph file name is required');
  process.exit(1)
}

let layout = pipeline([
  runLayout,
  getLayoutDimensions,
  printLayoutDimensions,
])

pipeline([
  readGraph,
  layout,
  // printStats,
  detectClusters,
  fanoutClusters,
  // printClusterContext
  // layoutGraphs,
  // printSizes
])({
  fileName: graphFileName
})

function fanoutClusters(ctx) {
  let subLayouts = ctx.clusterGraphs.map(g => {
    let subctx = {
      graph: g
    }
    return layout(subctx)
  });

  return Promise.all(subLayouts).then(x => {
    ctx.subLayouts = x;
    return ctx
  });
}

function printClusterContext(ctx) {
  console.log('Detected clusters #', ctx.clusterGraphs.length)
  ctx.clusterGraphs.forEach((g, idx) => {
    console.log('Cluster ' + idx + '. Nodes count: ' + g.getNodesCount() + '; Links count: ' + g.getLinksCount());
  });
}

function printStats(ctx) {
  const graph = ctx.graph;
  console.log('Links count:', graph.getLinksCount() + '; Nodes count: ' + graph.getNodesCount());
  return graph
}

function printLayoutDimensions(info) {
  // let's assume node size is N pixels
  const avgNodeSide = 20;
  const oneNodeArea = avgNodeSide * avgNodeSide;
  const graph = info.graph;
  const nodeCount = graph.getNodesCount()

  const minNodeArea = nodeCount * oneNodeArea
  // let's also assume that each edge is Mx avg avgNodeSide
  let linkLength = 3 * avgNodeSide;
  const minEdgeArea = graph.getLinksCount() * linkLength;

  const estimatedArea = minEdgeArea + minNodeArea;
 
  const actualArea = info.layoutDimensions.width * info.layoutDimensions.height
  // console.log('actual, estimated, nodes, edges, width, height');
  console.log([
    actualArea,
    estimatedArea,
    graph.getNodesCount(),
    graph.getLinksCount(),
    info.layoutDimensions.width,
    info.layoutDimensions.height
  ].join(','));

  return info
}
