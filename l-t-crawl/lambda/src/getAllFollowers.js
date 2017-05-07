let RATE_LIMIT_EXCEEDED = 88;
let NOT_FOUND = 34;

// We don't want to send all quota on celebrities.
// If more that this number of followers are found, we return incomplete results.
let MAX_FOLLOWERS = 50000;

module.exports = getAllFollowers;

function getAllFollowers(T, request) {
  let accumulator = [];

  return getAll(request);

  function getAll(request) {
		request.count = 5000;
    console.log('followers/ids', request);

    return T.get('followers/ids', request).then(resp => {
      let { data } = resp;

      if (data.errors) {
        let error = data.errors[0];
        if(error.code === RATE_LIMIT_EXCEEDED) {
          console.log('Rate limit exceeded at', new Date());
          let waitTime = getWaitTime(resp.resp.headers);
          // we are done for now.
          return {
            wait: waitTime,
            request,
            accumulator
          };
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
      } if (!data.ids) {
        if (data.error === 'Not authorized.') {
          console.log('Not authorized ', request);
          return {
            accumulator: [],
            error: 403
          };
        }
        console.log(data);
        throw new Error('no ids');
      }

      // save everyone we've got.
      data.ids.forEach(id => accumulator.push(id));

      // and iterate if we have more
      let { next_cursor } = data;
      let needMore = next_cursor && accumulator.length < MAX_FOLLOWERS;
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

function getWaitTime(headers) {
  let resetAt = Number.parseInt(headers['x-rate-limit-reset'], 10);
  if (Number.isFinite(resetAt)) {
    // give it one second to clear up
    return resetAt * 1000 - new Date() + 1000;
  }

  // wait X seconds
  return 30 * 1000;
}
