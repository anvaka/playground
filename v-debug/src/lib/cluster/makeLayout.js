import ngraphLayout from 'ngraph.forcelayout';
import getFloatOrDefault from '../getFloatOrDefault';
import d3Layout from './d3layout';
// const setInitialLayout = require('./setInitialLayout');

export default function makeLayout(graph, settings) {
  if (settings.selectedLayout === 'ngraph') {
    return ngraphLayout(graph, extractSettings(settings));
  }

  return d3Layout(graph, settings);
}

function extractSettings(settings) {
  let cleanSettings = {
   springLength: getFloatOrDefault(settings.springLength,  30),
   springCoeff : getFloatOrDefault(settings.springCoeff,   0.0008),
   gravity     : getFloatOrDefault(settings.gravity,       -1.2),
   theta       : getFloatOrDefault(settings.theta,         0.8),
   dragCoeff   : getFloatOrDefault(settings.dragCoeff,     0.02),
   timeStep    : getFloatOrDefault(settings.timeStep,      20)
  };
  if (settings.nodeMass) {
    cleanSettings.nodeMass = settings.nodeMass;
  }
  return cleanSettings;
}
