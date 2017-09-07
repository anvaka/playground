let test = require('tap').test;
let NodeHeap = require('../NodeHeap');

test('it can add items', (t) => {
  let q = new NodeHeap();
  q.push(3);
  q.push(1);
  q.push(5);
  let last = Number.NEGATIVE_INFINITY;
  while(q.length) {
    let current = q.pop();
    t.ok(last <= current, 'Elements ordered: ' + current + ' > ' + last);
    last = current;
  }
  t.end();
})

test('it can have custom comparer', (t) => {
  let q = new NodeHeap({
    compare: (a, b) => {
      return b - a;
    }
  });
  q.push(3);
  q.push(1);
  q.push(5);
  let last = Number.POSITIVE_INFINITY;
  while(q.length) {
    let current = q.pop();
    t.ok(current <= last, 'Elements ordered: ' + current + ' < ' + last);
    last = current;
  }
  t.end();
});

test('it can be initialized with array', (t) => {
  let input = [3, 1, 5];

  new NodeHeap(input);

  for (let i = 1; i < input.length; ++i) {
    let current = input[i];
    let last = input[i - 1];
    t.ok(last <= current, 'Elements ordered: ' + last + ' < ' + current);
  }
  t.end();
})

test('it can track node id', (t) => {
  let nodes = [{v: 10}];
  new NodeHeap(nodes, {
    setNodeId(node, id) {
      node.id = id;
    }
  })
  t.equals(nodes[0].id, 0, 'id is set');
  t.end();
});

test('it initializes ids for multiple nodes', (t) => {
  let nodes = [];
  for (let i = 0; i < 13; ++i) {
    nodes.push({
      v: Math.random() * 100
    });
  }
  debugger;
  let heap = new NodeHeap(nodes, {
    compare(a, b) {
      return a.v - b.v;
    },
    setNodeId(node, id) {
      node.id = id;
    }
  });

  for (let i = 0; i < nodes.length; ++i) {
    let current = nodes[i];
    t.equals(current.id, i, 'id is initialized correctly');
  }
  let prev = {v: Number.NEGATIVE_INFINITY};
  while (heap.length) {
    let current = heap.pop();
    t.ok(prev.v <= current.v, 'Sort is preserved ' + current.v + ' ' + prev.v);
    prev = current;
  }

  t.end();
});

test('it updates ids when popped', (t) => {
  let nodes = [{v: 10}, {v: 5}];
  let heap = new NodeHeap(nodes, {
    compare(a, b) {
      return a.v - b.v;
    },
    setNodeId(node, id) {
      node.id = id;
    }
  });

  let popped = heap.pop();
  t.equals(popped.id, 0, 'Popped from the top');
  t.equals(heap.peek().id, 0, 'Element at the top of the heap has updated its id');

  t.end();
});

test('it can update node values', (t) => {
  let nodes = [{v: 10}, {v: 5}, {v: 14}];
  let heap = new NodeHeap(nodes, {
    compare(a, b) {
      return a.v - b.v;
    },
    setNodeId(node, id) {
      node.id = id;
    }
  });

  // we update our sort key. Let's ask heap to rebuild index for this node
  let lastItem = nodes[2];
  lastItem.v = 1;

  heap.updateItem(lastItem.id);
  
  t.equals(heap.peek().v, 1, 'First element was updated');
  t.equals(heap.length, 3, 'Length is preserved')

  let prev = {v: Number.NEGATIVE_INFINITY};
  while (heap.length) {
    let current = heap.pop();
    t.ok(prev.v <= current.v, 'Sort is preserved ' + current.v + ' ' + prev.v);
    prev = current;
  }

  t.end();
})