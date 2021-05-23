let createGraph = require('ngraph.graph');
const { FONT } = require('../constants');

module.exports = function buildGraph() {
  let usersPerRequest = 7;
  let userId = getCurrentPageUserId();
  if (!userId) throw new Error('Could not detect user id on this page');
  console.log('Found user id: ', userId);
  console.log('Fetching authentication headers to construct graph. Scroll page a little down if nothing happens');
  let html = document.querySelector('html');
  let prevScroll = html.scrollTop;
  html.scrollTop = 700; // force scrolling, so that events will be fired;
  setTimeout(() => (html.scrollTop = prevScroll), 100);
  let link = document.querySelector('a[href*="connect_people"]');
  if (link) {
    let loading = document.createElement('div');
    loading.setAttribute('id', 'map-loader');
    loading.innerText = 'Loading map...'
    loading.style.color = 'rgb(110, 118, 125)';
    loading.style.fontFamily = FONT;
    loading.style.padding = '18px';
    loading.style.fontSize = '18px';
    link.insertAdjacentElement('beforebegin', loading);
  }

  let currentScreenName = window.location.pathname.substring(1);
  let img = document.querySelector(`a[href*="photo"] img[src*="profile_images"]`);
  let currentUserData = {
    id: userId,
    name: currentScreenName,
    screenName: currentScreenName,
  }
  if (img)  {
    currentUserData.image = img.src;
  }

  return fetchHeaders().then(headers => {
    return buildGraphInternal(userId, headers);
  });

  function buildGraphInternal(startFrom, headers) {
    let graph = createGraph();

    return findRelated(userId, usersPerRequest, headers).then(queue => {
      console.log('Initial users: ', queue);
      graph.addNode(userId, currentUserData);
      return downloadQueue(userId, queue, 0);
    }).then(() => {
      console.log('all done', graph);
      return graph;
    });

    function downloadQueue(cameFrom, queue, itemIndex) {
      if(itemIndex >= queue.length) return;

      let user = queue[itemIndex];
      let currentUserId = user.id;
      graph.addNode(currentUserId, user);
      graph.addLink(cameFrom, currentUserId);

      return findRelated(currentUserId, usersPerRequest, headers).then(related => {
        related.forEach(other => {
          if (!graph.hasNode(other.id)) graph.addNode(other.id, other);
          graph.addLink(currentUserId, other.id);
        });
      }).then(x => {
        return downloadQueue(cameFrom, queue, itemIndex + 1);
      });
    }
  }
}

function getCurrentPageUserId() {
  const USER_ID_RELATED = /connect_people\?user_id=(\d+)/;
  let users = Array.from(document.querySelectorAll('a[href*="connect_people"]')).filter(a => a.href.match(USER_ID_RELATED))

  if (users.length > 0) {
    return users[0].href.match(USER_ID_RELATED)[1];
  }
}

// This is for anonymous browser.
// we need to know `authorization` and `x-guest-token` headers
function fetchHeaders() {
  // x-csrf-token
  let requiredHeaders = new Set(['authorization', document.cookie.indexOf('twid') > -1 ? 'x-csrf-token' : 'x-guest-token']);
  let headers = {};

  return new Promise((resolve, reject) => {
    (function(setRequestHeader) {
        XMLHttpRequest.prototype.setRequestHeader = function(key, value) {
          let shouldResolve = false;
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
  let nextReset;
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
  }).then(x => {
    let rateLimitRemaining = x.headers.get('x-rate-limit-remaining');
    let reset = Number.parseInt(x.headers.get('x-rate-limit-reset'), 10);
    nextReset = new Date(reset * 1000);
    console.log('Rate limit: ' + rateLimitRemaining + ', reset: ' + nextReset);
    return x.json();
  }).then(x => {
    if (x.errors && x.errors[0] && x.errors[0].code === 88) {
      let loader = document.querySelector('#map-loader');
      loader.innerText = 'Cannot build a graph: API rate limit exceeded. Try again at ' + nextReset.toLocaleTimeString();
      return new Promise(() => {
        // this never resolves
      })
    }
    return x.map(({user}) => {
      return {
        description: user.description,
        id: user.id_str,
        name: user.name,
        screenName: user.screen_name,
        followers: user.followers_count,
        following: user.friends_count,
        statuses: user.statuses_count,
        location: user.location,
        image: user.profile_image_url_https,
      }
    });
  })
}