import {EPS} from './geom';
import SplayTree from 'splaytree';

export default function createEventQueue() {
  const q = new SplayTree(byY);

  return {
    isEmpty: isEmpty,
    size: size,
    pop: pop,
    push: push,
    find: find,
    merge: merge,
    insert: insert
  }

  function find(p) {
    return q.find(p);
  }

  function size() {
    return q.size;
  }

  function isEmpty() {
    return q.isEmpty();
  }

  function push(event) {
    var current = q.find(event.point);
    if (current) {
      return current.data.merge(event);
    } else {
      q.insert(event.point, event);
    }
  }

  function insert(event) {
    q.insert(event.point, event);
  }

  function merge(current, event) {
    current.data.merge(event);
  }

  function pop() {
    var node = q.pop();
    return node && node.data;
  }
}

function byY(a, b) {
  // decreasing Y 
  var res = b.y - a.y;
  // TODO: This might mess up the status tree.
  if (Math.abs(res) < EPS) {
    // increasing x.
    res = a.x - b.x;
    if (Math.abs(res) < EPS) res = 0;
  }

  return res;
}
