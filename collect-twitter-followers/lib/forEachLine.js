const readline = require('readline');
const fs = require('fs');

module.exports = forEachLine;

function forEachLine(input, callback) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(input)
    });

    rl.on('line', callback)
    rl.on('close', resolve)
    rl.on('error', reject);
  });
}
