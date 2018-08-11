export default find;

function find(arr, predicate) {
  if (!arr) return

  for (var i = 0; i < arr.length; ++i) {
    var item = arr[i]
    if (predicate(item)) return item
  }

  return undefined
}
