module.exports = vorojoin;


const fs = require('fs');
const createGraph = require('ngraph.graph')
const VPTreeFactory = require('./lib/vptree');
const distances = require('./lib/distances');
const createCornerManipulator = require('./lib/createCornerManipulator');

function vorojoin(sites, options = {}) {
  if (!options) options = {};
  if (!options.getPoint) options.getPoint = getPointFromArray;
  // if (!options.distance) options.distance = distances.euclid;
  if (!options.distance) options.distance = distances.chebushev;
  if (!options.getClusterId) options.getClusterId = getClusterId;

  const bordersByPolygonId = new Map();
  let matrix = [];
  let internalSites = sites.map(options.getPoint);
  let tree = VPTreeFactory.build(internalSites, options.distance);
  let shortestDistance = Infinity;
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  // let tree = new VPTree(options.distance, internalSites)
  internalSites.forEach(site => {
    let neighbors = tree.search(site, 2).filter(x => x.d);
    if (neighbors[0] === undefined) throw new Error('No neighbors?');
    if (neighbors[0].d < shortestDistance) shortestDistance = neighbors[0].d;

    if (site[0] < minX) minX = site[0];
    if (site[0] > maxX) maxX = site[0];
    if (site[1] < minY) minY = site[1];
    if (site[1] > maxY) maxY = site[1];
  });
 
  if (shortestDistance === 0) throw new Error('You have duplicate points?');

  let gridStep = shortestDistance * 0.15;
  console.log('Shortest distance is ' + shortestDistance)
  let width = maxX - minX;
  let height = maxY - minY;
  const gridSize = 1000;
  gridStep = width / gridSize;

  let cols = gridSize; // Math.ceil(width / gridStep);
  let rows = gridSize; // Math.ceil(height / gridStep);
  console.log(`Cols: ${cols}; Rows: ${rows}`)
  run();
  dumpMatrix();

  return {
    getSVG
  }

  function getSVG() {

  }

  function run() {
    buildMatrix();
    buildBoundsOverMatrix();
  }
  
  function buildMatrix() {
    for (let y = 0; y < rows; ++y) {
      let row = [];
      matrix[y] = row;
      for (let x = 0; x < cols; ++x) {
        let p = getPoint(x, y);
        row[x] = options.getClusterId(tree.search(p, 1)[0].i);
      }
    }
  }

  function buildBoundsOverMatrix() {
    let cornerManipulator = createCornerManipulator(matrix);

    for (let y = 0; y < rows - 1; ++y) {
      for (let x = 0; x < cols - 1; ++x) {
        cornerManipulator.forEachPolygon(y, x, addBoundsToPolygon);
      }
    }
  }

  function addBoundsToPolygon(polygonId, from, to) {
    let borders = getBordersForPolygon(polygonId);
    let fromId = getNodeId(from);
    let toId = getNodeId(to);
    if (borders.hasLink(fromId, toId) || borders.hasLink(toId, fromId)) return;

    borders.addNode(fromId, from)
    borders.addNode(toId, to)
    borders.addLink(fromId, toId);
  }

  function getBordersForPolygon(polygonId) {
    let graph = bordersByPolygonId.get(polygonId);
    if (!graph) {
      graph = createGraph();
      bordersByPolygonId.set(polygonId, graph);
    }

    return graph;
  }

  function getNodeId(point) {
    return point.join(',');
  }

  function dumpMatrix() {
    // for (let y = 0; y < rows; ++y) {
    //   console.log(matrix[y].join(' '))
    // }
    const width = matrix[0].length;
    const height = matrix.length;
    let buff = [];
    buff.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><g id="scene">`)
    buff.push(`<rect x="0" y="0" width="${width}" height="${height}" fill="rgba(40, 60, 80, 0.5)"/>`);
    bordersByPolygonId.forEach(dumpGraphPaths)

    for (let y = 0; y < rows; ++y) {
      for (let x = 0; x < cols; ++x) {
        // buff.push(`<text font-size="0.2" x="${x}" y="${y}">${matrix[y][x]}</text>`)
      }
    }
    buff.push('</g></svg>')
    fs.writeFileSync('./out.svg', buff.join('\n'), 'utf8')
    console.log('saved to ' + 'out.svg')

  function dumpGraphPaths(graph, id) {
    let visited = new Set();
    let paths = [];
    id *= 20;

    let color = 'white';// `rgba(${id * 2}, ${id * 3}, ${id * 4}, 0.5)`;;
    graph.forEachLink(link => {
      let from = graph.getNode(link.fromId).data;
      let to = graph.getNode(link.toId).data;
      buff.push(`<line x1="${from[1]}" y1="${from[0]}" x2="${to[1]}" y2="${to[0]}" stroke="${color}" stroke-width='0.1'/>`)
    });
    /*
    graph.forEachNode(node => {
      if (visited.has(node.id)) return;
      let path = [];
      paths.push(path);
      dfs(node, path);
    });

    console.log(paths)

    function dfs(startFrom, path) {
      let enqueued = new Set();
      let stack = [startFrom];

      while (stack.length) {
        let next = stack.pop();
        path.push(next.data);
        visited.add(next.id);

        graph.forEachLinkedNode(startFrom.id, other => {
          if (visited.has(other.id)) return;
          if (enqueued.has(other.id)) return;
          enqueued.add(other.id);
          stack.push(other);
        })
      }
    }
    */
  }
  }




  function getPoint(x, y) {
    return [
      minX + (x + 0.5) * gridStep,
      minY + (y + 0.5) * gridStep
    ]
  }

  function getPointFromArray(x) {
    return [x[0], x[1]];
  }

  function getClusterId(pointIndex) {
    return pointIndex;
  }
}