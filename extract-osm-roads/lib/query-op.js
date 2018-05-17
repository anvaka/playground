// This is based on https://www.npmjs.com/package/query-overpass
// (C) Per Liedman per@liedman.net, https://github.com/perliedman/query-overpass/blob/master/LICENSE.md
// 
// Adapted to promises by Andrei Kashcha https://github.com/anvaka
var querystring = require('querystring');
var request = require('request');

module.exports = function(query, options) {
  options = options || {};
  var overpassUrl = options.overpassUrl || 'https://lz4.overpass-api.de/api/interpreter'
  var timeout = options.timeout || 25000;
  var format = options.format || 'json';
  var outStream = options.out || process.stdout;

  if (!options.skipPrefix) {
    var prefix = `[out:${format}][timeout:${timeout}];\n`;
    query = prefix + query;
  }
  console.warn('running: ');
  console.warn(query);

  return new Promise((resolve, reject) => {
    var reqOptions = {
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: querystring.stringify({ data: query })
    };

    var r = request.post(overpassUrl, reqOptions);

    r.on('response', function(response) {
      if (response.statusCode != 200) {
        r.abort();
        return reject({
          message: 'Request failed: HTTP ' + response.statusCode,
          statusCode: response.statusCode
        });
      }

      response.pipe(outStream)
        .on('error', reject)
        .on('end', resolve);
    })
  });
};
