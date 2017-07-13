module.exports = getAirlinesLayout;

function getAirlinesLayout(graph) {
  let idToPos = new Map();
  let minWeight = Number.POSITIVE_INFINITY;
  let maxWeight = Number.NEGATIVE_INFINITY;

  const api = {
    positions: [],
    edges: [],
    tighten,
    getWeight,
    getNodePosition,
    layout: { getNodePosition }
  }
  updateApiPositions()

  return api

  function getWeight(link) {
    return link.weight/(maxWeight - minWeight)
  }

  function updateApiPositions() {
    let positions = []
    let edges = []
    idToPos = new Map();

    graph.forEachNode(node => {
      const pos = {
        x: node.data.x,
        y: node.data.y,
        id: node.id,
        r: node.data.r || 1
      }
      idToPos.set(node.id, pos);
      positions.push(pos)
    })

    graph.forEachLink(link => {
      let weight = (link.data && link.data.weight) || 1
      edges.push({
        weight: weight,
        from: idToPos.get(link.fromId),
        to: idToPos.get(link.toId),
      })
      if (weight < minWeight) minWeight = weight;
      if (weight > maxWeight) maxWeight = weight;
    })

    api.positions = positions;
    api.edges = edges;
  }

  function getNodePosition(nodeId) {
    return graph.getNode(nodeId).data
  }

  function tighten(nodeId) {
    do {
      let toLinks = []
      let from = getNodePosition(nodeId);

      graph.forEachLinkedNode(nodeId, (other) => {
        toLinks.push({
          id: other.id,
          pos: getNodePosition(other.id)
        })
      });

      let angles = []
      let min_bundleable_length = 10;// TODO: Should come from settings?

      for (let i = 0; i < toLinks.length; ++i) {
        let to = toLinks[i].pos
        let secondAngle = getAngle(from, to)
        let length = getLength(from, to);
        if (length > min_bundleable_length) {
          angles.push({
            angle: normalizeAngle(secondAngle),
            length: length,
            id: toLinks[i].id
          })
        }
      }

      if (angles.length < 1) return;

      angles.sort((x, y) => {
        return x.angle - y.angle
      })

      let max_angle = 30
      let sequence = getMinMaxSequence(angles, max_angle)
      if (!sequence) return;

      let bundle = []
      for(var i = sequence.start; i < sequence.end; ++i) {
        bundle.push(angles[i % angles.length])
      }


      let endAngle = bundle[bundle.length - 1].angle
      let startAngle = bundle[0].angle;
      if (endAngle < startAngle) endAngle += 360

      let median = (endAngle + startAngle) / 2

      let minLength = Number.POSITIVE_INFINITY;
      let removedWeight = 0;

      let removedWeightByNode = new Map();

      for (let i = 0; i < bundle.length; ++i) {
        // not sure what's the best way to choose a bundling point. For now it's
        // based on the shortest link in the bundle
        // Here we just find which link has the shortest length
        let otherLink = bundle[i];
        if (otherLink.length < minLength) minLength = otherLink.length;

        // We are not going to need this link anymore
        let otherLinkObj = graph.getLink(nodeId, otherLink.id) || graph.getLink(otherLink.id, nodeId);
        let w = (otherLinkObj && otherLinkObj.data && otherLinkObj.data.weight) || 1
        removedWeight += w
        removedWeightByNode.set(otherLink.id, w);

        graph.removeLink(otherLinkObj);
      }

      let midPointOffset = minLength * 0.5
      let bundleNodeId = +(new Date())
      let targetBundlePoint = {
        x: from.x + midPointOffset * Math.cos(median * Math.PI / 180),
        y: from.y + midPointOffset * Math.sin(median * Math.PI / 180),
        id: bundleNodeId,
        r: 0.4
      }

      graph.addNode(bundleNodeId, targetBundlePoint);
      graph.addLink(nodeId, bundleNodeId, {
        weight: removedWeight
      });

      for (let i = 0; i < bundle.length; ++i) {
        let otherLink = bundle[i];

        graph.addLink(bundleNodeId, otherLink.id, {
          weight: removedWeightByNode.get(otherLink.id)
        });
      }
      updateApiPositions();
    } while(true);
  }


  function getLength(from, to) {
    let dy = to.y - from.y;
    let dx = to.x - from.x
    return Math.sqrt(dx * dx  + dy * dy)
  }

  function getAngle(from, to) {
    let dy = to.y - from.y;
    let dx = to.x - from.x
    return normalizeAngle(Math.atan2(dy, dx) / Math.PI * 180)
  }
}

function getMinMaxSequence(angles, maxAngle) {
  // Asumption that angles are sorted in increasing order.
  let maxSequenceLength = 0;
  let maxSequenceStart = 0;

  if (angles.length < 1) return; // no angles - no sequence
  let twoRounds = []
  let i = 0;
  let lastAngle
  for (i = 0; i < angles.length; ++i) {
    lastAngle = angles[i].angle
    twoRounds.push(lastAngle)
  }

  let stopAt = normalizeAngle(lastAngle + maxAngle);

  // add partial second round
  for (i = 0; i < angles.length ; ++i) {
    lastAngle = angles[i].angle

    if (lastAngle > stopAt) {
      // we partially extend the array to make sure we are not missing
      // cones at the start/end
      break;
    }

    lastAngle = angles[i].angle + 360
    twoRounds.push(lastAngle);
  }


  let runningSum = 0;
  let currentSequenceStart = 0;

  for (i = 1; i < twoRounds.length; i++) {
    var angle = twoRounds[i] - twoRounds[i - 1]

    runningSum += angle
    while (runningSum > maxAngle) {
      runningSum -= (twoRounds[currentSequenceStart + 1] - twoRounds[currentSequenceStart])
      currentSequenceStart += 1
    }

    var sequenceLength = i - currentSequenceStart
    if (sequenceLength > maxSequenceLength) {
      maxSequenceLength = sequenceLength;
      maxSequenceStart = currentSequenceStart;
    }
  }

  if (maxSequenceLength < 1) return;

  let start = maxSequenceStart % angles.length
  return {
    start: start,
    end: start + maxSequenceLength + 1
  }
}

function roundGrid (x, gridStep) {
  return x;
  // return Math.round(x / gridStep) * gridStep
}

function normalizeAngle(angle) {
  if (angle < 0) {
    return 360 + angle
  }
  return angle
}
