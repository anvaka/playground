// First step - find area id of required city;
var query_overpass = require('./lib/query-op.js');

var cityName = process.argv[2];
if (!cityName) {
  console.error('Please pass city name as the first argument to this script');
  console.error('E.g. this will find all areas with Amsterdam as a name:');
  console.error('  node 1.find-area-id.js "Amsterdam"');
  process.exit(1);
}

console.error('Searching for ' + cityName);

query_overpass(`
area["name"="${cityName}"];
out body;
`).then(print).catch(e => console.log(e));

function print(res) {
  console.log(res);
}


