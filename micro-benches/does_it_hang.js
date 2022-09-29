const map = new Map();

map.set('foo', 42);
let count = 0;
map.forEach(el => {
  count += 1;
  map.delete('foo');
  map.set('foo', 2);
});
// you will  never see this actually
console.log('Count is', count);
