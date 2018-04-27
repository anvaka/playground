var cheerio = require('cheerio'); 
var rp = require('request-promise-native');

module.exports = function getPage(uri) {
  return rp({uri, transform});
}

function transform(body) {
    return cheerio.load(body);
}