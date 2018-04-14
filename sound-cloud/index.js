const client = require('http');
const client_id = process.env.SOUND_CLOUD_CLIENT_ID;
const fs = require('fs');

module.exports = downloadUsers;

let offset = 0;
const all = [];

downloadNext().then(() => {
  fs.writeFileSync('users.json', JSON.stringify(all));
  console.log('users.json saved');
});

function downloadNext() {
  return downloadUsers(offset).then(x => {
    x.forEach(u => all.push(u));

    if (x.length > 0) {
      offset += 200;
      return downloadNext();
    }
  });
}

function downloadUsers(offset) {
  let endpoint = 'http://api.soundcloud.com/users/';
  return new Promise((resolve, reject) => {
    var url = endpoint + '?limit=200&client_id=' + client_id + '&offset=' + offset;
    console.log('Downloading ' + url)

    const req = client.get(url, (res) => {
      const chunks = [];

      res.on('data', (d) => { chunks.push(d); });
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
  });
}
