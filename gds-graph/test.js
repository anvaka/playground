const Datastore = require('@google-cloud/datastore');
const createGraph = require('./lib/createGraph.js');

const projectId = process.env.DATASTORE_PROJECT_ID || 'streak-146302';
console.log('project id: ', projectId);

// Instantiate a datastore client
const datastore = Datastore({
  projectId
});

const g = createGraph(datastore);

g.addNode('user', 'anvaka', {
  name: 'Andrei',
  gender: 'M'
});

g.addNode('user', 'daria', {
  name: 'Daria',
  gender: 'F'
});

console.time('addLink');
g.addLink(['user', 'anvaka'], 'follows', ['user', 'thlorenz'])
  .then(() => {
    console.timeEnd('addLink');
  });

g.save();
let query = datastore.createQuery('edges')
  .filter('toId', '=', 'user.thlorenz')
  .filter('verb', '=', 'follows')
  .order('timestamp', {
    descending: true
  });

datastore.runQuery(query)
  .then(results => {
    console.log(results);
  });

// const ancestorKey = datastore.key(['user', 'anvaka']);
// let query = datastore.createQuery('edges')
//   .select('__key__')
//   // .hasAncestor(ancestorKey)
//   // .order('timestamp')
//
// datastore.runQuery(query).then(results => {
//   const users = results[0];
//
//   const foundKeys = users.map(u => {
//     let path = u[Datastore.KEY].path;
//     path.push('data', 'default');
//     return datastore.key(path);
//   });
//
//   datastore.get(foundKeys).then(r => {
//     console.log(r);
//   });
// }).catch(e => console.log(e));
