var express = require('express');
var app = express();
let processRequests = require('../src/processRequests');

app.get('/', function (req, res) {
  const qs = req.query;
  const requests = JSON.parse(qs.requests);
  const key = JSON.parse(qs.auth);

  console.log(requests, key);

  processRequests(requests, key)
    .then(response => {
      res.send(JSON.stringify(response));
    })
  .catch(err => {
    console.log('Error', err, key);
  });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
})
