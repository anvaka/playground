let Twit = require('twit');
let getAllFollowers = require('./getAllFollowers.js');

module.exports = processRequests;

function processRequests(requests, auth) {
  let T = new Twit(auth);
  let finalResult = {
    users: []
  };

  return processNext(0);

  function processNext(idx) {
    let r = requests[idx];
    let user_id;
    if (typeof r === 'number') {
      user_id = r;
      return getAllFollowers(T, { user_id }).then(processResponse);
    } else {
      if (!r.id) throw new Error('Invalid request ' + JSON.stringify(r));

      user_id = r.id;
      return getAllFollowers(T, { user_id, cursor: r.cursor }).then(processResponse);
    }

    function processResponse(result) {
      if (result.wait) {
        finalResult.wait = result.wait;
      }

      let user = { id: user_id };
      if (result.accumulator && result.accumulator.length) {
        user.followers = result.accumulator;
      }
      if (result.wait) {
        user.wait = true;
      }
      if (result.error) {
        user.error = result.error;
      }
      if (result.request) {
        user.cursor = result.request.next_cursor;
      }

      finalResult.users.push(user);

      if (finalResult.wait || idx + 1 >= requests.length) {
        // we are done for now.
        return finalResult;
      }

      return processNext(idx + 1);
    }
  }
}
