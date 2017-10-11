import queryState from 'query-state';

var qs = queryState();
var pendingSave;
var defaults = {
  timeStep: 0.01,
  dropProbability: 0.009,
  particleCount: 10000,
  fadeout: .998
}

let settingsPanel = {
  collapsed: window.innerWidth < 600 ? true : false,
};

export default {
  settingsPanel,
  saveBBox,
  getBBox,
  saveCode,
  getCode,

  getDropProbability,
  setDropProbability,

  getIntegrationTimeStep,
  setIntegrationTimeStep,

  getParticleCount,
  setParticleCount,

  getFadeout,
  setFadeout
}

function getFadeout() {
  let fadeout = qs.get('fo');
  return defined(fadeout) ? fadeout : defaults.fadeout;
}

function setFadeout(fadeout) {
  if (!defined(fadeout)) return;
  qs.set({fo: fadeout});
}

function getParticleCount() {
  let particleCount = qs.get('pc');
  return defined(particleCount) ? particleCount : defaults.particleCount;
}

function setParticleCount(particleCount) {
  if (!defined(particleCount)) return;
  qs.set({pc: particleCount});
}

function getIntegrationTimeStep() {
  let timeStep = qs.get('dt');
  return defined(timeStep) ? timeStep : defaults.timeStep;
}

function setIntegrationTimeStep(dt) {
  if (!defined(dt)) return;
  qs.set({dt: dt})
}

function getDropProbability() {
  let dropProbability = qs.get('dp');
  return defined(dropProbability) ? dropProbability : defaults.dropProbability;
}

function setDropProbability(dropProbability) {
  if (!defined(dropProbability)) return;
  clamp(dropProbability, 0, 1);
  qs.set({dp: dropProbability})
}

function clamp(x, min, max) {
  return x < min ? min :
        (x > max) ? max : x;
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