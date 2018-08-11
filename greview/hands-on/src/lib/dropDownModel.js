export default function createDropDown(items) {
  let index = buildIndex(items);

  items.findByValue = function(name) {
    return index[name];
  }

  return items;
}

function buildIndex(items) {
  var index = Object.create(null);

  items.forEach((d, id) => {
    let value = d.value || d.name
    index[value] = d
    index.key = id
  });
  return index;
}
