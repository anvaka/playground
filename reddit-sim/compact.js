var forEachSub = require('./lib/forEachSub');
var inputName = process.argv[2] || './all.json';
var outFolder = 'data-compact';
var fs = require('fs');
var path = require('path');

var all = [];
forEachSub(inputName, x => {
  var line = [x.name];
  x.similar.forEach(sim => line.push(sim.sub));
  all.push(line);
}, print);

function print() {
  var sizeByLetter = new Map();
  all.sort((a,b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
  all.forEach(x => {
    let line = JSON.stringify(x);
    let key = x[0][0].toLowerCase();
    let sizeInfo = sizeByLetter.get(key);
    if (!sizeInfo) {
      sizeInfo = {
        size: 0,
        lines: []
      };
      sizeByLetter.set(key, sizeInfo);
    }
    sizeInfo.size += line.length;
    sizeInfo.lines.push(line);
  });

  const entries = Array.from(sizeByLetter);
  let binNumber = 0;
  const MAX_SIZE = 500000;
  const packed = new Set();

  while (entries.length) {
    const keyValuePair = entries.pop();
    const name = keyValuePair[0];
    if (packed.has(name)) {
      continue;
    }

    const bin = createBin(MAX_SIZE);
    let size = keyValuePair[1].size;
    bin.take(size, name, keyValuePair[1].lines);
    packed.add(name);
    // if (!bin.canTake(0)) continue;

    for (var i = 0; i < entries.length; ++i) {
      const otherPair = entries[i];
      const otherName = otherPair[0];
      const otherSize = otherPair[1].size;
      if (!packed.has(otherName) && bin.canTake(otherSize)) {
        packed.add(otherName);
        bin.take(otherSize, otherName, otherPair[1].lines);
      }
    }
    bin.print();
    bin.save(binNumber);
    binNumber += 1;
  }
}

function createBin(maxSize) {
  let currentSize = 0;
  let name = '';
  let lines = [];
  return {
    canTake(size) {
      return currentSize + size <= maxSize;
    },
    take(size, chunkName, chunkLines) {
      currentSize += size;
      name += chunkName;
      lines = lines.concat(chunkLines);
    },
    print() {
      console.log(name + ' - ' + currentSize + '; lines: ' + lines.length);
    },
    save(prefix) {
      var outName = path.join(outFolder, `${prefix}_${name}.json`)
      fs.writeFileSync(outName, '[' + lines.join(',') + ']', 'utf8');
    }
  }
}