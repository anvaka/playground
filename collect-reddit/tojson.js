const fs = require('fs');
const dot = require('ngraph.fromdot');
const tojson = require('ngraph.tojson');

const dotFile = process.argv[2];

if (!fs.existsSync(dotFile)) {
  console.log('pass dot file as the first argument');
  process.exit(1);
}

const content = fs.readFileSync(dotFile, 'utf8');
const graph = dot(content);
console.log(tojson(graph));
