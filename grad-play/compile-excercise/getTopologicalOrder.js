/**
 * Given a `Variable` returns traversal order that visits all
 * parents before children.
 * 
 * Implementation is not recursive and can be used on large graphs.
 */
export function getTopologicalOrder(start) {
  recalculateParentsCount(start);

  let traversalOrder = [];
  let visited = new Set();
  let queue = [start];
  while (queue.length > 0) {
    let node = queue.shift();
    if (visited.has(node)) continue;

    if (node.parentCount !== 0) {
      throw new Error('Should have no parents at this point');
    }

    traversalOrder.push(node);
    visited.add(node);

    node.children.forEach(visitAndEnqueueOrphans);
  }

  return traversalOrder;

  function visitAndEnqueueOrphans(child) {
    child.parentCount -= 1
    if (child.parentCount === 0) {
      queue.push(child);
    }
  }
}

export function recalculateParentsCount(from) {
  setParentCountToZero(from)

  let queue = [from];
  let visited = new Set();
  while (queue.length > 0) {
    let node = queue.pop();
    if (visited.has(node)) continue;
    visited.add(node);
    node.children.forEach(child => {
      child.parentCount += 1;
      queue.push(child);
    });
  }
}

function setParentCountToZero(from) {
  let queue = [from];
  let visited = new Set();
  while (queue.length > 0) {
    let node = queue.pop();
    if (visited.has(node)) continue;
    visited.add(node);
    node.parentCount = 0;
    node.children.forEach(child => queue.push(child));
  }
}
