/**
 * This script finds subreddits that have a given subreddit among top matches.
 * 
 * E.g. `videos` is very popular subreddit and it has very high jaccard similarity
 * with other very popular subreddits. So to find less known subs, we do reverse
 * search: who has `videos` in the top 5 subreddit?
 */
var forEachSub = require('./lib/forEachSub');

var searchFor = 'videos';
var totalLength = 0;
var count = 0;
var lengths = [];
var related = [];

forEachSub('all.json', function(sub) {
  totalLength += sub.similar.length;
  lengths.push(sub.similar.length);
  count += 1;
  for (var i = 0; i < 5; ++i) {
    if (matches(sub.similar[i])) {
      related.push(sub.name);
    }
  }
}, function() {
  lengths.sort((a, b) => a - b);
  console.log('p50', lengths[Math.floor(lengths.length/2)], lengths[0], lengths[lengths.length - 1]);
  console.log('Avg degree: ', totalLength/count);
  console.log('related ', related);
})

function matches(sub) {
  return sub && sub.sub === searchFor
}