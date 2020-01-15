var Pbf = require('pbf');
var place = require('../proto/place.js').place;

module.exports = function protoBufExport(grid, name) {
  let nodes = [];
  let ways = [];
  let date = (new Date()).toISOString();

  grid.elements.forEach(x => {
    let elementType = 0;
    if (x.type === 'node') {
      nodes.push(x)
    } else if (x.type === 'way') {
      ways.push(x)
    }
  });

  let pbf = new Pbf()
  place.write({name, date, areaId: grid.areaId, nodes, ways}, pbf);
  return pbf.finish();
}