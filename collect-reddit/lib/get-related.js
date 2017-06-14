let downloadAbout = require('./download-about.js');
let REDDIT_LOOKUP = /\/r\/([a-zA-Z0-9_.:\-]+)/g;

module.exports = getRelated;

function getRelated(subName) {
  return downloadAbout(subName).then(extractRelated);
}

function extractRelated(subredit) {
  let display_name = subredit.display_name;
  let description = subredit.description;

  let uniqueSubs = new Set(
    description.match(REDDIT_LOOKUP)
      .map(x => x.toLowerCase().substr(3))
  );

  return {
    display_name,
    subscribers: subredit.subscribers,
    related: Array.from(uniqueSubs)
  }
}
