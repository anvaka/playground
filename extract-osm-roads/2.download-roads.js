
// First step - find area id of required city;
var query_overpass = require('./lib/query-op.js');

var areaId = process.argv[2];

if (!areaId) {
  console.error('Please pass area id as the first argument to this script');
  console.error('To find required area id, run:');
  console.error('  node 2.download-roads.js 3600197198 > data/3600197198.json');
  process.exit(1);
}

let highwayTags = [
  'motorway',
  'motorway_link',
  'trunk',
  'trunk_link',
  'primary',
  'primary_link',
  'secondary',
  'secondary_link',
  'tertiary',
  'tertiary_link',
  'unclassified',
  'unclassified_link',
  'residential',
  'residential_link',
  'service',
  'service_link',
  'living_street',
  'pedestrian',
  'road'
].join('|');

let roadFilter = `["highway"~"${highwayTags}"]`;
console.error('Searching for area ', areaId);

let query = `
(
 way${roadFilter}(area:${areaId});
 node(w);
);
out skel;`

query_overpass(query)
  .then(print).catch(e => console.log(e));

function print(res) {
  console.log(res);
}
