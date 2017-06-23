// Let's say you have an ngraph instance:
const downloadedFile = process.argv[3] || 'abouts.json';
const forEachSub = require('./lib/forEachSub.js');
const extractRelated = require('./lib/extract-related.js');

// // To detect clusters:
//
console.log("name, accounts_active, subscribers, edges");
forEachSub(downloadedFile, (sub) => {
  const subName = sub.display_name.toLowerCase();
  const subInfo = extractRelated(sub);
  console.log([
    subName, 
    sub.accounts_active,
    sub.subscribers,
    subInfo.related.length
  ].join(','));
}, () => {
});
