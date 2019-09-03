const createOutStream = require("./createOutStream");

const fetch = require('node-fetch');
let outFileName = 'subreddits.json';
let output = createOutStream(outFileName);
let subreddits = ['dataisbeautiful', 'math', 'programming', 'javascript', 'MapPorn']
let fieldsToFetch = ['author', 'created_utc', 'crosspost_parent', 'downs', 'gilded', 'edited', 'hidden', 'is_meta', 'is_original_content', 'is_self', 'is_video', 'ups', 'title', 'selftext', 'over_18', 'num_comments', 'num_crossposts', 'permalink', 'score', 'stickied']
let last = 0;

processNext()

function processNext() {
  if (last >= subreddits.length) {
    return;
  }
  const name = subreddits[last];
  last += 1;

  console.log((new Date()).toUTCString() + '; fetching ' + name)
  fetch(`https://www.reddit.com/r/${name}.json?limit=100`)
    .then(x => x.json())
    .then(x => {
      let posts = extractFieldsFromPosts(x.data.children);
      output.write({
        name,
        time: (new Date()).toUTCString(),
        posts
      })
    })
    .then(() => wait(3000))
    .then(processNext)
}

function extractFieldsFromPosts(rawPosts) {
  return rawPosts.map(toPost);
}

function toPost(x) {
  return fieldsToFetch.reduce((post, fieldName) => {
    let value = x.data[fieldName];
    if (value) post[fieldName] = value;
    return post;
  }, {});
}

function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

