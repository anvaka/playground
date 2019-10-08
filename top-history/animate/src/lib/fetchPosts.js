import formatNumber from "./formatNumber";
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
          isModerator: p.distinguished === 'moderator',
          createdStr: getHumanFriendlyTimeSinceCreation(band),
          scoreStr: formatNumber(p.score)
        }
      }).filter(x => {
        return x.band > 0 && x.band < 288 && !x.isModerator;
      }).map((post, index) => {
        post.index = index;
        return post;
      });

      return posts;
    });
}