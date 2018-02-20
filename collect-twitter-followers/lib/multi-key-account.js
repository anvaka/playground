const Twit = require('twit')
const RATE_LIMIT_EXCEEDED = 88;
const COULD_NOT_AUTH = 32;

module.exports = createMultiKeyAccount;

function createMultiKeyAccount(keys) {
  var clients = keys.map(key => {
    var auth = {
      consumer_key:        key.consumer_key,
      consumer_secret:     key.consumer_secret,
      access_token:        key.access_token,
      access_token_key:    key.access_token_key,
      access_token_secret: key.access_token_secret
    };
    return {
      resetAt: 0,
      auth: auth,
      T: new Twit(auth)
    }
  });

  var current = 0 ;

  return {
    get: get
  }

  function get(path, request) {
    return getFree().then(instance => {
      return instance.T.get(path, request).then(resp => {
        var err = resp.data && resp.data.errors && resp.data.errors[0];
        if (!err) return resp;
        console.log('err', err);
        if (err.code === RATE_LIMIT_EXCEEDED) {
          instance.resetAt = getResetTime(resp.resp.headers);
          // Try another client
          return get(path, request);
        }
        if (err.code === COULD_NOT_AUTH) {
          console.log('Warning! bad account: ', JSON.stringify(instance.auth));
          instance.bad = true;
          return get(path, request);
        }
        return resp;
      });
    })
  }

  function getFree() {
    return new Promise(resolve => {
      var minResetAt = Number.POSITIVE_INFINITY;
      var client = null;
      for (var i = 0; i < clients.length; ++i) {
        var curClient = clients[i];
        if (curClient.bad) continue;

        if (curClient.resetAt < minResetAt) {
          minResetAt = curClient.resetAt;
          client = curClient;
        }
      }
      if (client === null) throw new Error('No available accounts');

      var minWaitTime = minResetAt - (new Date());
      if (minWaitTime <= 0) {
        resolve(client);
      } else {
        console.log('All accounts depleted. Waiting ' + minWaitTime + 'ms; Time: ' + new Date());

//   const until = new Date(ms + (+new Date()));
        console.log('resuming at ' + new Date(+(new Date()) + minWaitTime));
        setTimeout(() => resolve(client), minWaitTime);
      }
    });
  }
}

function getResetTime(headers) {
  let resetAt = Number.parseInt(headers['x-rate-limit-reset'], 10);
  if (Number.isFinite(resetAt)) {
    // give it one second to clear up
    return resetAt * 1000 + 1000;
  }

  // wait X seconds
  return new Date() + 30 * 1000;
}
