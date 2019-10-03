import { getHumanFriendlyTimeSinceCreation } from "./getHumanFriendlyTimeSinceCreation";

export default function fetchPosts(subreddit = '/r/dataisbeautiful') {
  return fetch(`https://www.reddit.com${subreddit}.json`)
    .then(x => x.json())
    .then(x => {
      let now = new Date();
      let posts = x.data.children.map(p => {
        p = p.data;
        let created = new Date(p.created_utc * 1000);
        let elapsed = (now - created);
        let band = Math.round(elapsed/1000/60/5);
        return {
          score: p.score,
          created,
          permalink: 'https://www.reddit.com' + p.permalink,
          title: p.title,
          band,
          createdStr: getHumanFriendlyTimeSinceCreation(band)
        }
      }).filter(x => {
        return x.band > 0 && x.band < 288;
      });
      return posts;
      });
}