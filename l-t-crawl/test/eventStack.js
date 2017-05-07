const eventStack = require('../lib/eventStack'); 
const test = require('tap').test;

test('it can push events for future pop', function(t) {
  let item = 42;

  let stack = eventStack(function popedItem(e) {
    t.equals(e, item);
    t.end();
  });

  stack.push(item);
});

test('it can push events with delay', function(t) {
  let item = 42;
  let delay = 100;
  let launchTime = new Date();

  let stack = eventStack(function popedItem(e) {
    t.equals(e, item);
    let passed = new Date() - launchTime;
    t.ok(passed >= delay, 'delay is correct');
    t.end();
  });

  stack.push(item, delay);
});
