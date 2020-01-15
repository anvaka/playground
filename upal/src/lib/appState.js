import createQueryState from 'query-state';

const queryState = createQueryState({}, {useSearch: true});

export default {
  drawLabels: true,
  get() {
    return queryState.get.apply(queryState, arguments);
  },
  set() {
    return queryState.set.apply(queryState, arguments);
  }
}