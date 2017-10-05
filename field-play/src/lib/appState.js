import queryState from 'query-state';

var qs = queryState();
var pendingSave;

export default {
  saveBBox,
  getBBox,
  saveCode,
  getCode
}

function getBBox() {
  let cx = qs.get('cx');
  let cy = qs.get('cy');
  let w = qs.get('w');
  let h = qs.get('h');

  let bboxDefined = defined(cx) && defined(cy) && defined(w) && defined(h);
  if (!bboxDefined) return;

  let w2 = w/2;
  let h2 = h/2;
  return {
    minX: cx - w2,
    maxX: cx + w2,
    minY: cy - h2,
    maxY: cy + h2
  };
}

function defined(number) {
  return Number.isFinite(number);
}

function saveBBox(bbox) {
  if(pendingSave) {
    clearTimeout(pendingSave);
    pendingSave = 0;
  }

  pendingSave = setTimeout(() => saveReally(bbox), 300);
}

function saveReally(bbox) {
  pendingSave = 0;
  qs.set({
    cx: (bbox.minX + bbox.maxX) * 0.5,
    cy: (bbox.minY + bbox.maxY) * 0.5,
    w: (bbox.maxX - bbox.minX),
    h: (bbox.maxX - bbox.minX)
  });
}

function getCode() {
  return qs.get('code');
}

function saveCode(code) {
  qs.set({
    code: code
  });
}