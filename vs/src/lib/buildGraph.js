import corsFetch from "./corsFetch";
import bus from '../bus';

export const MAX_DEPTH = 2;

export default function buildGraph(entryWord) {
  let cancelled = false;
  let pendingResponse;
  let graph = require('ngraph.graph')();
  let suffix = 'vs'
  let queue = [];
  let requestDelay = 300 + Math.random() * 100;

  startQueryConstruction();

  return {
    dispose,
    graph
  }

  function dispose() {
    cancelled = true;
    if (pendingResponse) {
      pendingResponse.cancel();
      pendingResponse = null;
    }
  }

  function startQueryConstruction() {
    graph.addNode(entryWord, {depth: 0});
    fetchNext(entryWord);
  }

  function loadSiblings(parent, results) {
    let q = (fullQuery(parent) + ' ').toLocaleLowerCase();
    var parentNode = graph.getNode(parent);

    if (!parentNode) {
      throw new Error('Parent is missing for ' + parent);
    }

    results.filter(x => x.toLocaleLowerCase().indexOf(q) === 0)
      .map(x => x.substring(q.length))
      .forEach(other => {
        if (graph.hasNode(other)) return;

        let depth = parentNode.data.depth + 1;
        graph.addNode(other, {depth});
        graph.addLink(parent, other);
        if (depth < MAX_DEPTH) queue.push(other);
      });

    setTimeout(loadNext, requestDelay);
  }

  function loadNext() {
    if (cancelled) return;
    if (queue.length === 0) {
      bus.fire('graph-ready', graph);
      return;
    }

    let nextWord = queue.shift();
    fetchNext(nextWord);
  }

  function fetchNext(query) {
    pendingResponse = getResponse(fullQuery(query));
    pendingResponse.then(res => onPendingReady(res, query));
  }

  function onPendingReady(res, query) {
    if (res.length >= 2) {
      loadSiblings(query, res[1]);
    } else {
      console.error(res);
      throw new Error('Unexpected response');
    }
  }

  function fullQuery(query) {
    return query + ' ' + suffix;
  }

  function getResponse(query) {
    return corsFetch('//suggestqueries.google.com/complete/search?client=firefox&q=' + encodeURIComponent(query));
  }
}