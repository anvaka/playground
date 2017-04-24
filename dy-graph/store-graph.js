const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient({
  region: 'us-west-2'
});

var DyGraph = require('./lib/DyGraph.js');

var g = new DyGraph({
  edgesTable: 'Graph_Edges',
  nodesTable: 'Graph_Nodes',
  dynamo
});

g.addNode('user.anvaka', {
  description: 'I love graphs'
});

g.addNode('repo.pat310/google-trends-api', {
  description: 'An API layer on top of google trends'
});

g.addEdge('user.anvaka', 'star.repo.pat310/google-trends-api');
g.addEdge('user.anvaka', 'follows.user.thlorenz');

g.save().then(() => {
  console.log('all done');
}).catch((e) => {
  console.log('err', e);
});

