export function getSpherical(r, theta, phi) {
  let z = r * Math.cos(theta);
  let x = r * Math.sin(theta) * Math.cos(phi);
  let y = r * Math.sin(theta) * Math.sin(phi);
  return [x, y, z];
}

export function clamp(v, min, max) {
  if (v < min) v = min;
  if (v > max) v = max;
  return v;
}

export function option(value, fallback) {
  if (value === undefined) return fallback;
  return value;
}

export function clampTo(x, threshold, clampValue) {
  return Math.abs(x) < threshold ? clampValue : x;
}