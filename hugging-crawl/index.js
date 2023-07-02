const fs = require('fs');
const likersEndpoint = 'https://huggingface.co/api/models/$model_id/likers';
const modelsEndpoint = 'https://huggingface.co/models-json?p=$page_number';
const outputFileName = 'models.json';

const outputStream = fs.createWriteStream(outputFileName);

let lastPage = 0;
next();

function next() {
  console.log('downloading page', lastPage);
  getNextPage(lastPage).then(x => {
    x.models.forEach(x => outputStream.write(JSON.stringify(x) + '\n'));
    if (lastPage * x.numItemsPerPage < x.numTotalItems) {
      lastPage += 1;
      setTimeout(next, 0);
    }
  }).catch(err => {
    console.log('error', err);
  });
}

function getNextPage(pageNumber) {
  let url = modelsEndpoint.replace('$page_number', pageNumber);
  return fetch(url, {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-US,en;q=0.9,ru;q=0.8,uk-UA;q=0.7,uk;q=0.6,tr;q=0.5",
      "sec-ch-ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"macOS\"",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
    },
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET"
  }).then(x => x.json())
}