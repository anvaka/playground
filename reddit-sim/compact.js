var forEachSub = require('./lib/forEachSub');
var inputName = process.argv[2] || './all.json';
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
    let key = x[0][0];
    sizeByLetter.set(key, (sizeByLetter.get(key) || 0) + line.length);
    if (key === 's') console.log(line)
  });
  //console.log(sizeByLetter)
}