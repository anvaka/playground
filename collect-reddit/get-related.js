let downloadAbout = require('./download-about.js');
let REDDIT_LOOKUP = /\/r\/([^\/\])#\s.,!]+)/g;

downloadAbout('virtualization').then(extractRelated)
.then(x => console.log(x))

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
