import buildGraph from './lib/buildGraph';

const queryState = require('query-state');

const qs = queryState({
  query: ''
}, {
  useSearch: true
});

let lastBuilder;
const appStateFromQuery = qs.get();
const appState = {
  hasGraph: false,
  graph: null,
  query: appStateFromQuery.query,
}

if (appState.query) {
  // performSearch(appState.query);
}

export default appState;

qs.onChange(updateAppState);

function updateAppState(newState) {
  appState.query = newState.query;
}

export function performSearch(queryString) {
  appState.hasGraph = true;
  qs.set('query', queryString);
  if (lastBuilder) {
    lastBuilder.dispose();
  }

  lastBuilder = buildGraph(queryString)
  appState.graph = Object.freeze(lastBuilder.graph);
  return lastBuilder.graph;
}
