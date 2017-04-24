const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient({
  region: 'us-west-2'
});

var DyGraph = require('./lib/DyGraph.js');

var g = new DyGraph({
  edgesTable: 'Graph_Edges',
  nodesTable: 'Graph_Nodes',
  dynamo,
});

g.getOutEdges('user.anvaka').then((edges) => {
  console.log('anvaka -> ', edges);
});

g.getOutEdges('user.anvaka', 'follows').then((edges) => {
  console.log('anvaka follows -> ', edges);
});

g.getInEdges('star.repo.pat310/google-trends-api').then((edges) => {
  console.log('stargazers of repo.pat310/google-trends-api-> ', edges);
});
