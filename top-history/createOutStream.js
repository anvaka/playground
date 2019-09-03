let fs = require('fs');
let JSONStream = require('JSONStream');

module.exports = createOutStream;

function createOutStream(outFileName, flags='a') {
  let outgoing = JSONStream.stringify(false);
  var fileStream = fs.createWriteStream(outFileName, {
    encoding: 'utf8',
    flags
  });
  outgoing.pipe(fileStream);
  return outgoing;
}