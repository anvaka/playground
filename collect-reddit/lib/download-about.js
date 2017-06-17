const client = require('https');
const url = require('url');

module.exports = downloadAbout;

function downloadAbout(subredit, retryCount) {
  if (retryCount === undefined) retryCount = 3;

  return new Promise((resolve, reject) => {
    let endpoint = 'https://www.reddit.com/r/' + subredit + '/about.json';
    console.log('Downloading ' + endpoint);

    const req = client.get(Object.assign({
      headers: {
        'User-Agent': '/u/anvaka'
      }
    }, url.parse(endpoint)), (res) => {
      const chunks = [];
      // console.log(res.headers);

      res.on('data', (d) => {
        chunks.push(d);
      });
      res.on('end', () => {
        if (res.statusCode === 302) {
          // Most likely this sub was removed. 302 goes to search redirect
          resolve({
            display_name: subredit,
            error: 302
          });
          return;
        }
        if (res.statusCode === 502 && (retryCount > 0)) {
          return downloadAbout(subredit, retryCount - 1).then(resolve).catch(reject);
        }

        let r;
        try {
          r = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        } catch (e) {
          console.error('!Error during parsing request for ' + subredit);
          console.error('!Headers: ', JSON.stringify(res.headers));
          console.error('!Error: ', JSON.stringify(e));
          console.error('!Status: ' + res.statusCode);
          throw e;
        }

        if (r.error === 404 || r.error === 403) {
          // Not found sub? Private sub? No worries
          resolve({
            display_name: subredit,
            error: r.error
          });
        } else {
          resolve(r.data);
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
