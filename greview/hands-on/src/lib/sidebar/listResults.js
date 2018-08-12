import dropdown from '../dropDownModel.js'

import salesRank from './sort/sales.js'
import inDegree from './sort/inDegree.js'
import date from './sort/published.js'
import pagerank from './sort/pageRank.js'
import pageCount from './sort/pageCount.js'
import graphStore from '../graph';

let allSortMethods = [inDegree,  salesRank, date, pageCount, pagerank]
const store = createListResults()

export default store;

function createListResults() {
  let graph = graphStore.getGraph();
  let asins = graphStore.getAsins();

  let vm = {
    visible: false,
    items: [],
    selectedMethod: 'Popularity',
    sortMethods: getAvailableSorts([]),
    updateSort,
    getValue
  }

  updateSort();

  return vm

  function updateSort(selectedMethod) {
    let sorter = getCurrentSorter(selectedMethod);

    if (!sorter) {
      sorter = vm.sortMethods[0]
    } 
    vm.selectedMethod = sorter.name
    vm.sortMethods.forEach(method => {
      method.selected = (method.name === sorter.name);
    });

    asins.sort(sorter.sort);
    vm.items = asins
  }

  function getCurrentSorter(selectedMethod) {
    return vm.sortMethods.findByValue(selectedMethod || vm.selectedMethod)
  }

  function getValue(item) {
    let currentSorter = getCurrentSorter()
    if (!currentSorter) throw new Error('Current sorter is not defined')

    return currentSorter.display(item)
  }

  function getAvailableSorts(items) {
    let sorts = allSortMethods.filter(x => x.canHandle(items))
      .map(sorter => sorter.getSorter(graph, items))

    return dropdown(sorts)
  }
}
