import {MAX_DEPTH} from './buildGraph';
import createFakeLayout from './fakeLayout';
import createInterpolateLayout from './createInterpolateLayout';

let createLayout = require('ngraph.forcelayout')
const USE_FAKE = 1;
const USE_INTERPOLATE = 2;
const USE_REAL = 3;

/**
 * Orchestrates layout of algorithm between phases.
 */
export default function createAggregateLayout(graph) {
  let physicsLayout = createPhysicsLayout();
  let fakeLayout = createFakeLayout();
  let interpolateLayout = createInterpolateLayout(fakeLayout, physicsLayout);

  let isGraphReady = false;
  let layoutIterations = 0;
  let maxLayoutIterations = 4000;
  let phase = USE_FAKE;

  return {
    step,
    pinNode,
    getNodePosition,
    addNode,
    setGraphReady
  }

  function setGraphReady() {
    layoutIterations = 0;
    isGraphReady = true;
  }

  function addNode(nodeId, rect) {
    fakeLayout.addNode(nodeId, rect);
  }

  function getNodePosition(nodeId) {
    if (phase === USE_FAKE) return fakeLayout.getNodePosition(nodeId);
    if (phase === USE_REAL) return physicsLayout.getNodePosition(nodeId);
    if (phase === USE_INTERPOLATE) return interpolateLayout.getNodePosition(nodeId);
  }

  function step() {
    if (!isGraphReady || layoutIterations < maxLayoutIterations) {
      phase = USE_FAKE;
      let start = window.performance.now();
      fakeLayout.step();

      do {
        physicsLayout.step();
        layoutIterations += 1;
      } while (window.performance.now() - start < 10)

      if (layoutIterations >= maxLayoutIterations) phase = USE_INTERPOLATE;
    } else if (phase === USE_INTERPOLATE) {
      interpolateLayout.step();
      if (interpolateLayout.done()) {
        phase = USE_REAL;
      }
    } else {
    }
  }

  function pinNode(node) {
    physicsLayout.pinNode(node, true);
  }

  function createPhysicsLayout() {
    return createLayout(graph, {
      springLength: 20,
      springCoeff: 0.002,
      gravity: -1.2,
      theta: 0.8,
      dragCoeff: 0.02,
      timeStep: 14,
      nodeMass(nodeId) {
        let links = graph.getLinks(nodeId);
        let mul = links ? links.length : 1;
        let node = graph.getNode(nodeId);
        mul *=  (MAX_DEPTH - node.data.depth) + 1;
        return nodeId.length * mul;
      }
    });
  }
}