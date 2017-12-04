var readline = require('readline');
var fs = require('fs');

module.exports = forEachLine;

function forEachLine(input, callback) {
  return new Promise((resolve, reject) => {
    var rl = readline.createInterface({
      input: fs.createReadStream(input)
    });

    rl.on('line', callback)
    rl.on('close', resolve)
    rl.on('error', reject);
  });
}
