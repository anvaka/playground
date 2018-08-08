export default function getFloatOrDefault(x, defaultValue) {
  var value = Number.parseFloat(x);
  if (Number.isNaN(value)) return defaultValue;
  return value;
}
