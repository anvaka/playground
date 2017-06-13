const client = require('https');

module.exports = downloadAbout;

function downloadAbout(subredit) {
  return new Promise((resolve, reject) => {
    let endpoint = 'https://www.reddit.com/r/' + subredit + '/about.json';
    console.log('Downloading ' + endpoint);

    const req = client.get(endpoint, (res) => {
      const chunks = [];

      res.on('data', (d) => {
        chunks.push(d);
      });
      res.on('end', () => {
        let res = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        resolve(res.data);
      });
    });
    req.on('error', (e) => {
      console.error(e);
      reject(e);
    });

    req.end();
  });
}
