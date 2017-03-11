const https = require('https');
const fs = require('fs');
const JSONStream = require('JSONStream');

const MALE_DIVISION = 1;
const FEMALE_DIVISION = 2;

const currentDivision = MALE_DIVISION;
const outFileName = `athletes.${currentDivision}.js`;
const outgoing = createOutStream();
const lastPage = 1;

downloadNext(lastPage);

function downloadNext(lastPage) {
  fetchPage(lastPage, currentDivision, () => {
    console.log('Finished downloading page ' + lastPage);
    downloadNext(lastPage + 1);
  });
}

function fetchPage(page, division, done) {
  const path =  `/competitions/api/v1/competitions/open/2017/leaderboards?competition=1&year=2017&division=${division}&scaled=0&sort=0&fittest=1&fittest1=0&occupation=0&page=${page}`;
  let options = {
    hostname: 'games.crossfit.com',
    port: 443,
    path,
    method: 'GET'
  };

  console.log('scheduling page ' + page);
  const req = https.request(options, (res) => {
    let allBuffers = [];
    res.on('data', (d) => {
      allBuffers.push(d);
    });

    res.on('end', () => {
      let contentString = Buffer.concat(allBuffers).toString('utf8');
      let content;
      try {
        content = JSON.parse(contentString);
      } catch(e) {
        console.error('Failed to download ' + path, e);
        throw e;
      }

      console.log('Saving page ' + page);
      content.athletes.forEach(athlet => outgoing.write(athlet));
      done();
    });
  });

  req.on('error', (e) => {
    console.error(e);
  });
  req.end();
}

function createOutStream() {
  var outgoing = JSONStream.stringify(false);
  var fileStream = fs.createWriteStream(outFileName, {
    encoding: 'utf8',
    flags: 'a'
  });
  outgoing.pipe(fileStream);

  return outgoing;
}
