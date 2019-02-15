var createMultiKeyClient = require('./multi-key-account');

const client = createMultiKeyClient([{
  consumer_key:        process.env.TWITTER_CONSUMER_KEY,
  consumer_secret:     process.env.TWITTER_CONSUMER_SECRET,
  access_token:        process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
}]);

//const client = createMultiKeyClient(require('/home/pnaka/twitter/arr.js'));

const RATE_LIMIT_EXCEEDED = 88;
const NOT_FOUND = 34;

// We don't want to send all quota on celebrities.
// If more that this number of followers are found, we return incomplete results.
const MAX_FOLLOWERS = 50000;

module.exports = {
  getAllFollowersByScreenName,
  getAllFollowersByUserId,
  getTimeline,
  convertIdsToUser
}

function getTimeline(request) {
    return client.get('statuses/user_timeline', request).then(resp => {
      const { data } = resp;
      return data;
    })
}

function convertIdsToUser(ids, visitor) {
  let currentIndex = 0;

  return processNext();

  function processNext() {
    if (currentIndex < ids.length) {
      let slice = ids.slice(currentIndex, currentIndex + 100)
      currentIndex += 100;
      console.log('processing ' + currentIndex + ' out of ' + ids.length);
      return schedule(slice).then(processNext);
    } 
  }

  function schedule(user_id) {
    let request = { user_id };
    return client.get('users/lookup', request)
      .then(resp => {
        const { data } = resp;
        if (data.errors) {
          // todo: this may need more handling
          console.error(data.errors, '!!! error');
          throw new Error(data.errors);
        }
        data.forEach(user => visitor(user));
      });
  }
}

function getAllFollowersByUserId(user_id) {
  let request = { user_id };
  return getAllFollowers(request);
}

function getAllFollowersByScreenName(screen_name, max) {
  let request = { screen_name };
  return getAllFollowers(request, max);
}

function getAllFollowers(request, max) {
  let accumulator = [];

  return getAll(request);

  function getAll(request) {
		request.count = 5000;
    request.stringify_ids = true;
    console.log('followers/ids', request);

    return client.get('followers/ids', request).then(resp => {
      const { data } = resp;

      if (data.errors) {
        const error = data.errors[0];
        if(error.code === RATE_LIMIT_EXCEEDED) {
          // Impossible, because rate limit is handled by multi-key-account.js
          throw new Error('This should not be possible');
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

      var maxCount = max || MAX_FOLLOWERS
      // and iterate if we have more
      const { next_cursor } = data;
      const needMore = next_cursor && accumulator.length < maxCount;
      if (needMore) return getAll(Object.assign({}, request, { cursor: next_cursor }));

      // if no more pages, just return what we've collected
      let followersObject = {
        accumulator
      };

      if (accumulator.length < maxCount && next_cursor) {
        // this means that we stopped early.
        followersObject.next_cursor = next_cursor; // save next cursor if we ever decide to resume
      }

      return followersObject;
    });
  }
}
