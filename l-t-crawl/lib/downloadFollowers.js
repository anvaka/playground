const client = require('http');

module.exports = downloadFollowers;

function downloadFollowers(requests, auth) {
  return new Promise((resolve, reject) => {
    let endpoint = 'http://localhost:3000/';

    const req = client.get(endpoint + '?requests=' + urlArg(requests) + '&auth=' + urlArg(auth), (res) => {
      const chunks = [];

      res.on('data', (d) => {
        chunks.push(d);
      });
      res.on('end', () => {
        let res = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        resolve(res);
      });
    });
    req.on('error', (e) => {
      console.error(e);
      reject(e);
    });

    req.end();

    function urlArg(obj) {
      return encodeURIComponent(JSON.stringify(obj));
    }
  });
}
