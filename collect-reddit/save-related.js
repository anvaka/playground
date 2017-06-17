const downloadedFile = process.argv[3] || 'abouts.json';
const forEachSub = require('./lib/forEachSub.js');
const extractRelated = require('./lib/extract-related.js');
const random = require('ngraph.random').random(42);

const saveRatio = 1; // Save only XX% of the graph, so that we can explore it faster
let saved = 0;
let total = 0;

console.log('digraph reddit {');

forEachSub(downloadedFile, (sub) => {
  const subName = sub.display_name.toLowerCase();
  const subInfo = extractRelated(sub);
  if (subInfo.related.length === 0) {
    if (random.nextDouble() < saveRatio) {
      console.log(subName);
    }
  } else {
    total += subInfo.related.length;
    subInfo.related.forEach(x => {
      if (random.nextDouble() < saveRatio) {
        saved += 1;
        console.log(` ${subName} -> ${x}` );
      }
    });
  }
}, () => {
  console.log('}');
  console.error('Total edges: ', total, 'Saved edges: ' + saved);
});
