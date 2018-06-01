import formatNumber from './formatNumber';

export default function getMemoryInfo() {
  return null;
  // Unfortunately this only works in Chrome, and you need a special flag
  // https://trackjs.com/blog/monitoring-javascript-memory/

  if (typeof window === 'undefined') return;
  if (typeof window.performance === 'undefined') return;
  let memory = window.performance.memory;
  if (typeof memory === 'undefined') return;

  return {
    heapSize: formatNumber(memory.totalJSHeapSize),
    usedSize: formatNumber(memory.usedJSHeapSize),
    limit: formatNumber(memory.jsHeapSizeLimit),
  }
}