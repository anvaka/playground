var user = process.argv[2];

if (!user) {
  console.log('Pass user screen name')
  process.exit(-1);
}


const { getTimeline } = require('./lib/twitter-client.js');

getTimeline({
  screen_name: user,
  count: 200,
}).then(r => {
  console.log(JSON.stringify(r));
});
