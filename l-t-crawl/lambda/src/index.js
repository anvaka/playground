let processRequests = require('./processRequests.js');

function handler(event, context, callback) {
  const qs = event.queryStringParameters;
  const requests = JSON.parse(qs.requests);
  const key = JSON.parse(qs.auth);

  processRequests(requests, key)
    .then(response => {
      callback(null, createResponse(200, JSON.stringify(response)));
    });
}

function createResponse(statusCode, body) {
  return {
    statusCode,
    body,
  };
}

module.exports = {
  handler
};
