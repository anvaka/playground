import buildGraph from './lib/buildGraph';

const queryState = require('query-state');

const qs = queryState({
  query: ''
}, {
  useSearch: true
});

let lastBuilder;
const appState = qs.get();

export default appState;

qs.onChange(updateAppState);

function updateAppState(newState) {
  appState.query = newState.query;
}

export function performSearch(queryString) {
  qs.set('query', queryString);
  if (lastBuilder) {
    lastBuilder.dispose();
  }

  lastBuilder = buildGraph(queryString)
  return lastBuilder.graph;
}
