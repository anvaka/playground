import graphStore from '../graph'

const details = createDetails();

export default details;

function createDetails() {
  let vm = {
    product: {},
    visible: false,
    setAsin
  }

  return vm

  function setAsin(asin) {
    let product = graphStore.getAsin(asin)
    if (!product) throw new Error('Unknown asin requested: ' + asin)
    vm.product = product
  }
}
