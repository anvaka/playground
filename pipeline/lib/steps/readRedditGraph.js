const createGraph = require('ngraph.graph');
const fs = require('fs');
const JSONStream = require('JSONStream');
const es = require('event-stream');
const REDDIT_LOOKUP = /\.com\/r\/([a-zA-Z0-9_.:\-]+)/g;

module.exports = readRedditGraph;

function readRedditGraph(ctx) {
  return new Promise(resolve => {
    const graph = createGraph({uniqueLinkId: false});


    forEachSub(ctx.redditFileName, (sub) => {
      const subName = sub.display_name.toLowerCase();
      const subInfo = extractRelated(sub);

      graph.addNode(subName, sub.subscribers);

      if (subInfo.related.length > 0) {
        subInfo.related.forEach(x => {
          if (subName !== x) graph.addLink(subName, x);
        });
      }
    }, () => {
      ctx.graph = graph
      resolve(ctx)
    });
  })
}


function forEachSub(fileName, cb, done) {
  if (!fs.existsSync(fileName)) {
    console.error('No data file: ' + fileName);
    process.exit(-1);
  }

  var jsonStreamParser = JSONStream.parse();
  fs.createReadStream(fileName)
    .pipe(jsonStreamParser)
    .pipe(es.mapSync(cb))
    .on('end', done);
}

function extractRelated(subredit) {
  let display_name = subredit.display_name;
  let description = subredit.description;

  let matches = description && description.match(REDDIT_LOOKUP);
  let related;
  if (matches) {
    let uniqueSubset = new Set(matches.map(x => {
      let id = x.toLowerCase().substr(7)
      return id.replace(/[:.]+$/g, ''); // trim 
    })); // we remove preceding .com/r/ - 7 chars

    related = Array.from(uniqueSubset);
  }

  if (!related) related = [];

  return {
    display_name,
    related
  }
}
