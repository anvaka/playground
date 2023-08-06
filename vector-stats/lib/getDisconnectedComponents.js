module.exports = function getDisconnectedComponents(graph) {
  let components = [];
  let visited = Object.create(null);

  graph.forEachNode(node => {
    if (visited[node.id]) return;

    let component = [];
    components.push(component);

    let stack = [node];
    while (stack.length > 0) {
      let current = stack.pop();
      if (visited[current.id]) continue;

      visited[current.id] = true;
      component.push(current);

      graph.forEachLinkedNode(current.id, other => {
        stack.push(other);
      });
    }
  });

  return components;
}
