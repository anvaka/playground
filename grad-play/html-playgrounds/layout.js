import {Variable, NS, ReferenceVariable} from '../compile-excercise/Variable.js';

export function aggregateLayout(graph, random, count, rep = 1, ang = 1) {
  let layouts = [];
  let nodeIdToPos = new Map();
  for (let i = 0; i < count; ++i) {
    layouts.push(createLayout(graph, random, rep, ang));
  }
  graph.forEachNode(node => {
    nodeIdToPos.set(node.id, [0, 0]);
  });

  return {
    step,
    getNodePosition,
  }

  function step(learningRate) {
    layouts.forEach(layout => { layout.step(learningRate); });
    graph.forEachNode(node => {
      let pos = getNodePosition(node.id);
      layouts.forEach(layout => {
        layout.setNodePosition(node.id, pos);
      })
    });
  }

  function getNodePosition(nodeId) {
    let arr = nodeIdToPos.get(nodeId);
    arr[0] = 0; arr[1] = 0;
    layouts.forEach(layout => {
      let position = layout.getNodePosition(nodeId);
      arr[0] += position[0];
      arr[1] += position[1];
    });
    arr[0] /= count; 
    arr[1] /= count;
    return arr;
  }
}

export function createLayout(graph, random, repulsiveSampleRate = 1, angularSampleRate = 1) {
  let nodePositions = new Map();

  let ns = new NS();
  graph.forEachNode(node => {
    nodePositions.set(node.id, [
      getNodePosInit(ns), 
      getNodePosInit(ns)
    ]);
  });

  let angularLossImportance = new Variable(ns);
  let angularLossImportanceRef = new ReferenceVariable(ns);

  let {loss, zeroThis} = getLossGraph(graph, ns);
  loss.compile();

  let adamSE = new Float64Array(ns.gv.length);
  let adamSD = new Float64Array(ns.gv.length);

  let eps = 1e-8;
  adamSE.fill(Math.sqrt(0 + eps));

  angularLossImportanceRef.setReference(angularLossImportance);
  angularLossImportance.value = 0.001;

  let v = loss.ns.v;
  for (let i = 0; i < v.length; ++i) {
    if (i !== angularLossImportanceRef.id) v[i] = random.gaussian();
  }

  return {
    step,
    getNodePosition,
    setNodePosition,
  }

  function setNodePosition(nodeId, newPos) {
    let pos = nodePositions.get(nodeId);
    pos[0].value = newPos[0];
    pos[1].value = newPos[1];
  }

  function getNodePosition(nodeId) {
    return nodePositions.get(nodeId).map(v => v.value);
  }

  function step(learningRate) {
    let {v, gv} = loss.ns;
    let av = angularLossImportance.value;
    if (av < .99) {
      angularLossImportance.value = Math.max(0, av + 0.0005);
    }


    gv.fill(0);
    loss.forwardPass();
    loss.setGradient(1);
    loss.backwardPass();

    for (let i = 0; i < gv.length; ++i) {
      gv[i] = clip(5, gv[i]);
    }

    let adamBeta1 = 0.9;
    let adamBeta2 = 0.999;
    let momentumBeta = 0.9;
    let beta1Corrected = adamBeta1;
    let beta2Corrected = adamBeta2;

    for (let i = 0; i < v.length; ++i) {
      if (i === angularLossImportanceRef.id) continue;
      if (i === angularLossImportance.id) continue;
      // v[i] -= gv[i] * learningRate;
      let gradientUpdate = gv[i] * learningRate;
      // adam
      let gradient = gv[i];
      adamSE[i] = adamBeta1 * adamSE[i] + (1 - adamBeta1) * gradient;            // "momentum" update
      adamSD[i] = adamBeta2 * adamSD[i] + (1 - adamBeta2) * gradient * gradient; // "RMSProp" update
      let vCorrected = adamSE[i] / (1 - beta1Corrected);
      let sCorrected = adamSD[i] / (1 - beta2Corrected);
      beta1Corrected *= adamBeta1;
      beta2Corrected *= adamBeta2;

      let adamUpdate = learningRate * vCorrected / (Math.sqrt(sCorrected) + 1e-8);
      v[i] -= (adamUpdate);
    }

    for (let i = 0; i < zeroThis.length; ++i) {
      v[zeroThis[i].id] = 0;
    }
  }

  function getNodePosInit() {
    return new Variable(ns);
  }

  function getLossGraph(graph, ns) {
    let loss = 0; 
    let zeroThis = [];

    let angularLoss = 0;
    graph.forEachNode(node => {
      let currentAngularLoss = random.nextDouble() < angularSampleRate && getAngularLoss(node, graph);
      if (currentAngularLoss) {
        angularLoss = currentAngularLoss.add(angularLoss).mul(angularLossImportanceRef);
      }
    });

    if (angularLoss) {
      loss = angularLoss.div(graph.getNodesCount()).add(loss);
    }
    graph.forEachLink(e => {
      let d = getLength(pos(e.fromId), pos(e.toId));
      loss = d.add(loss);
    });

    graph.forEachNode(node => {
      let nodeLoss = new Variable(ns);
      zeroThis.push(nodeLoss);
      
      let count = 0;
      // graph.forEachLinkedNode(node.id, other => {
      //   if (other === node) return;
      //   let l = getLength(node.pos, other.pos).ParametricReLU(.1);
      //   nodeLoss = nodeLoss.add(l.pow(-2));
      //   count += 1;
      // })
      graph.forEachNode(other => {
        if (other === node) return;
        if (random.nextDouble() >= repulsiveSampleRate) return;
        let l = getLength(pos(node.id), pos(other.id)).ParametricReLU(.1);
        nodeLoss = nodeLoss.add(l.pow(-2));
        count += 1;
      });
      if (count) loss = loss.add(nodeLoss.div(count));
    });

    return {loss, zeroThis};
  }

  function pos(nodeId) {
    return nodePositions.get(nodeId);
  }

  function getAngularLoss(center, graph) {
    let loss = 0;
    let otherNodes = [];
    graph.forEachLinkedNode(center.id, other => { 
      otherNodes.push(pos(other.id)) ;
    });

    let centerPos = pos(center.id);
    for (let i = 0; i < otherNodes.length; ++i) {
      let from = otherNodes[i];
      for (let j = 0; j < otherNodes.length; ++j) {
        if (i === j) continue;
        let to = otherNodes[j];
        let angle = getAngle(from, to, centerPos);
        loss = angle.pow(-1).add(loss);
      }
    }

    return loss ? loss.div(10) : 0;
  }
}


function getAngle(from, to, center) {
  let xf = from[0].sub(center[0]);
  let yf = from[1].sub(center[1]);

  let xt = to[0].sub(center[0]);
  let yt = to[1].sub(center[1]);

  // let fAngle = atan2(yf, xf);
  // let tAngle = atan2(yt, xt);
  // return tAngle.sub(fAngle).abs();
  let e1Length = xf.pow(2).add(yf.pow(2)).pow(0.5);
  let e2Length = xt.pow(2).add(yt.pow(2)).pow(0.5);
  let dot = xf.mul(xt).add(yf.mul(yt));
  let cosAngle = dot.div(e1Length.mul(e2Length));
  return cosAngle.acos();
}

function getLength(a, b) {
  let dx = a[0].sub(b[0]).pow(2);
  let dy = a[1].sub(b[1]).pow(2); 
  return dx.add(dy).pow(.5);
}

function clip(max, x) {
  if (x > max) return max;
  if (x < -max) return -max;
  return x;
}