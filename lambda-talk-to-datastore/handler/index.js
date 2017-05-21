const Datastore = require('@google-cloud/datastore');

const projectId = process.env.DATASTORE_PROJECT_ID || 'streak-146302';
const datastore = Datastore({ projectId });

console.log('Data store initialized. Project id: ', projectId);

module.exports = {
  handler
};

function handler(event, context, callback) {
  console.log(JSON.stringify(event, context));
  const query = datastore.createQuery('edges')
  datastore.runQuery(query)
    .then((results) => {
      const edges = results && results[0];
      callback(null, createResponse(200, JSON.stringify(edges), event));
    });
}

function createResponse(statusCode, body) {
  return {
    statusCode,
    body
  };
}
