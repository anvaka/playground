const https = require('https');

module.exports = downloadFollowers;

function downloadFollowers(requests, auth) {
  return new Promise((resolve, reject) => {
    let endpoint = 'https://e7c1ekfa9f.execute-api.us-west-2.amazonaws.com/Stage/followers';

    https.get(endpoint + '?requests=' + urlArg(requests) + '&auth=' + urlArg(auth), (res) => {
      const chunks = [];

      res.on('data', (d) => {
        chunks.push(d);
      });
      res.on('end', () => {
        let res = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        resolve(res);
      });
    }).on('error', (e) => {
      console.error(e);
      reject(e);
    });

    function urlArg(obj) {
      return encodeURIComponent(JSON.stringify(obj));
    }
  });
}
