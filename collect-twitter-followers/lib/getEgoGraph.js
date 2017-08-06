/**
 * Returns list of followers for the first level and connections between them
 * Unlike get-twitter-graph this script does not include friends of friends level.
 */
const forEach = require('./forEach.js');
const fs = require('fs');

module.exports = getEgoGraph;

function getEgoGraph(inFileName) {
  const graph = require('ngraph.graph')({uniqueLinkId: false});
  if (!fs.existsSync(inFileName)) {
    return Promise.reject('in file name is required');
  }

  return forEach(inFileName, row => graph.addNode(row.id))
    .then(addSecondLevel)
    .then(() => graph);

  function addSecondLevel() {
    return forEach(inFileName, row => {
      let followers = row.followers && row.followers.accumulator;
      if (followers) {
        const toId = row.id;
        followers.forEach(f => {
          if (graph.getNode(f)) {
            graph.addLink(f, toId)
          }
        });
      }
    })
  }
}
