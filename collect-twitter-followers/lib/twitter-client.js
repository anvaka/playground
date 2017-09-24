const Twit = require('twit')

const T = new Twit({
  consumer_key:        process.env.TWITTER_CONSUMER_KEY,
  consumer_secret:     process.env.TWITTER_CONSUMER_SECRET,
  access_token:        process.env.TWITTER_ACCESS_TOKEN,
  access_token_key:    process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

const RATE_LIMIT_EXCEEDED = 88;
const NOT_FOUND = 34;

// We don't want to send all quota on celebrities.
// If more that this number of followers are found, we return incomplete results.
const MAX_FOLLOWERS = 50000;

module.exports = {
  getAllFollowersByScreenName,
  getAllFollowersByUserId,
  convertIdsToUser
}

function convertIdsToUser(ids, visitor) {
  let currentIndex = 0;

  return processNext();

  function processNext() {
    if (currentIndex < ids.length) {
      let slice = ids.slice(currentIndex, currentIndex + 100)
      currentIndex += 100;
      return schedule(slice).then(processNext);
    } 
  }

  function schedule(user_id) {
    let request = { user_id };
    return T.get('users/lookup', request)
      .then(resp => {
        const { data } = resp;
        if (data.errors) {
          // todo: this may need more handling
          const error = data.errors[0];
          if (error.code === RATE_LIMIT_EXCEEDED) {
            console.log('Rate limit exceeded at', new Date());
            let waitTime = getWaitTime(resp.resp.headers);
            return wait(waitTime).then(() => schedule(user_id));
          }
        }
        data.forEach(user => visitor(user));
      });
  }
}

function getAllFollowersByUserId(user_id) {
  let request = { user_id };
  return getAllFollowers(request);
}

function getAllFollowersByScreenName(screen_name) {
  let request = { screen_name };
  return getAllFollowers(request);
}

function getAllFollowers(request) {
  let accumulator = [];

  return getAll(request);

  function getAll(request) {
		request.count = 5000;
    console.log('followers/ids', request);

    return T.get('followers/ids', request).then(resp => {
      const { data } = resp;

      if (data.errors) {
        const error = data.errors[0];
        if(error.code === RATE_LIMIT_EXCEEDED) {
          console.log('Rate limit exceeded at', new Date());
          let waitTime = getWaitTime(resp.resp.headers);
          return wait(waitTime).then(() => getAll(request));
        } else if (error.code === NOT_FOUND) {
          console.log('Not found ', request);
          return {
            accumulator: [],
            error: 404
          };
        } else {
          console.log(data.errors);
          throw new Error(data.errors);
        }
      }
      if (!data.ids) {
        if (data.error === 'Not authorized.') {
          console.log('Not authorized ', request);
          return {
            accumulator: [],
            error: 403
          };
        }
        console.log('!!!Missing ids for: ', data);
        console.log('request was: ', request);
        return {
            accumulator: [],
            error: 'missing_ids'
        }
      }

      // save everyone we've got.
      data.ids.forEach(id => accumulator.push(id));

      // and iterate if we have more
      const { next_cursor } = data;
      const needMore = next_cursor && accumulator.length < MAX_FOLLOWERS;
      if (needMore) return getAll(Object.assign({}, request, { cursor: next_cursor }));

      // if no more pages, just return what we've collected
      let followersObject = {
        accumulator
      };

      if (accumulator.length < MAX_FOLLOWERS && next_cursor) {
        // this means that we stopped early.
        followersObject.next_cursor = next_cursor; // save next cursor if we ever decide to resume
      }

      return followersObject;
    });
  }
}

function wait(ms) {
  if (!ms) {
    ms = 2000;
  }
  const until = new Date(ms + (+new Date()));

  console.log('Waiting for ' + ms + 'ms; Until: ', until);
  return new Promise(resolve => {
    setTimeout(() => resolve(), ms);
  });
}

function getWaitTime(headers) {
  let resetAt = Number.parseInt(headers['x-rate-limit-reset'], 10);
  if (Number.isFinite(resetAt)) {
    // give it one second to clear up
    return resetAt * 1000 - new Date() + 1000;
  }

  // wait X seconds
  return 30 * 1000;
}
