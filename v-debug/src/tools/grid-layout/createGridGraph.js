const createGraph = require('ngraph.graph');
const cellKey = require('./cellKey');

module.exports = createGridGraph;

function createGridGraph(width, height, cellSize) {
  let cols = Math.ceil(width/cellSize);
  let rows = Math.ceil(height/cellSize);

  let grid = createGraph({uniqueLinkIds: false }); 

  for (let i = 0; i <= cols; ++i) {
    for (let j = 0; j <= rows; ++j) {
      let thisKey = cellKey(i, j);
      grid.addNode(thisKey, {
        row: j,
        col: i
      })
      if (i > 0) {
        grid.addLink(thisKey, cellKey(i - 1, j));
      }
      if (j > 0) {
        grid.addLink(thisKey, cellKey(i, j - 1));
      }
      // if (i > 0 && j > 0) {
      //   grid.addLink(thisKey, cellKey(i - 1, j - 1));
      // }
    }
  }

  return grid;
}