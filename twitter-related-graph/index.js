(function() {
// This is for anonymous browser.
// we need to know `authorization` and `x-guest-token` headers
function fetchHeaders() {
  let requiredHeaders = new Set(['authorization', 'x-guest-token']);
  let headers = {};

  return new Promise((resolve, reject) => {
    (function(setRequestHeader) {
        XMLHttpRequest.prototype.setRequestHeader = function(key, value) {
          if (requiredHeaders.has(key)) {
            headers[key] = value;
            shouldResolve = Object.keys(headers).length === requiredHeaders.size;
          } 
          setRequestHeader.apply(this, arguments);

          if (shouldResolve) {
            // restore to default handler
            XMLHttpRequest.prototype.setRequestHeader = setRequestHeader;
          }
          resolve(headers);
        };
    })(XMLHttpRequest.prototype.setRequestHeader);
  });
}

function findRelated(userId, limit, headers) {
  return fetch('https://twitter.com/i/api/1.1/users/recommendations.json?' + 
    [['include_profile_interstitial_type', 1],
    ['include_blocking', 1],
    ['include_blocked_by', 1],
    ['include_followed_by', 1],
    ['include_want_retweets', 1],
    ['include_mute_edge', 1],
    ['include_can_dm', 1],
    ['include_can_media_tag', 1],
    ['skip_status', 1],
    ['pc', 'true'],
    ['display_location', 'profile_accounts_sidebar'],
    ['limit', limit],
    ['user_id', userId],
    ['ext','mediaStats%2ChighlightedLabel']].map(pair => pair.join('=')).join('&'), {
    headers: headers,
    mode: 'cors'
  }).then(x => x.json()).then(x => {
    return x.map(({user}) => {
      return {
        description: user.description,
        id: user.id_str,
        name: user.name,
        screen_name: user.screen_name,
        followers: user.followers_count,
        following: user.friends_count,
        statuses: user.statuses_count,
        location: user.location,
      }
    });
  })
}

const USER_ID_RELATED = /connect_people\?user_id=(\d+)/;
let users = Array.from(document.querySelectorAll('a')).filter(a => a.href.match(USER_ID_RELATED))
if (users.length > 0) {
  let userId = users[0].href.match(USER_ID_RELATED)[1];
  console.log('Found user id: ', userId);
  fetchHeaders().then(headers => {
    window.headers = console.log(headers)
    findRelated(userId, 10, headers).then(x => {
      console.log(x);
      console.log('all done');
    });
  })
} else {
  console.error('Could not find a user id on this page.')
}
})()