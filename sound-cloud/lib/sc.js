module.exports = sc;
const client = require('https');

function sc(clientId) {
  let USERS_ENDPOINT = 'https://api.soundcloud.com/users/';

  return {
    get: get
  };

  function get(kind, userId) {
    var endpoint = USERS_ENDPOINT + userId + '/' + kind;
    var all = [];
    var url = endpoint + '?limit=200&offset=0&client_id=' + clientId;

    return downloadNext(url).then(() => {
      return all;
    });

    function downloadNext(href) {
      return downloadUsers(href).then(x => {
        if (x.collection) {
          x.collection.forEach(u => all.push(u));

          if (x.next_href) {
            return downloadNext(x.next_href);
          }
        }
      });
    }
  }

  function downloadUsers(url) {
    return new Promise((resolve, reject) => {
      console.log('Downloading ' + url)

      const req = client.get(url, (res) => {
        const chunks = [];

        res.on('data', (d) => { chunks.push(d); });
        res.on('end', () => {
          try {
            let res = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            resolve(res);
          } catch(e) {
            reject(e);
          }
        });
      });

      req.on('error', (e) => {
        console.error(e);
        reject(e);
      });

      req.end();
    });
  }

}