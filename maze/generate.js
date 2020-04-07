let graph = require('ngraph.graph')();
let toDot = require('ngraph.todot');
const randomAPI = require('ngraph.random');

let random = randomAPI();

let levelCount = 5;
let levelWidth = 4;
let mingleProbability = 0.2;

let allowedOperations = ['+', '-']
let minValue = 1;
let maxValue = 10;
let prevLevel;

for(let i = 0; i < levelCount; ++i) {
  let nextLevel = generateLevel();
  if (prevLevel) {
    connectLevels(prevLevel.to, nextLevel.from);
  }

  prevLevel = nextLevel;
}

console.log(toDot(graph));

function generateLevel() {
  let levelMin = minValue;
  let levelMax = maxValue;
  let correctGenerated = false;
  let from = [];
  let to = [];

  let linksToPush = []
  for (let i = 0; i < levelWidth; ++i) {
    let node = generateExpression(levelMin, levelMax)
    let fromId = toString(node);
    let isCorrect = !correctGenerated;

    if (isCorrect) {
      correctGenerated = true;
      // levelMin = pickRandomInRange(minValue, maxValue);
      // levelMax = levelMin + Math.round(Math.random() * 10);
    } else {
      let oldResult = node.result;
      do {
        node.result = pickRandomInRange(minValue, maxValue);
      } while (node.result === oldResult);
    }

    linksToPush.push({
      fromId, toId: node.result, isCorrect
    });
  }


  var randomIterator = randomAPI.randomIterator(linksToPush, random);
  randomIterator.shuffle();
  let levelEndpoints = new Map();
  linksToPush.forEach(link => {
    if (!levelEndpoints.has(link.toId)) {
      let v = makeUnique(link.toId);
      levelEndpoints.set(link.toId, v);
      graph.addNode(v);
    }
  });

  linksToPush.forEach(link => {
    let fromId = makeUnique(link.fromId);
    graph.addNode(fromId);
    let toId = levelEndpoints.get(link.toId);
    graph.addLink(fromId, toId);

    let isCorrect = link.isCorrect;
    from.push({id: fromId, isCorrect})
    to.push({id: toId, isCorrect})
  });

  mingleLinks(from, to);
  return {from, to};
}

function mingleLinks(from, to) {
  for (let i = 0; i < from.length; ++i) {
    let fromNode = from[i];
    for (let j = 0; j < to.length; ++j) {
      let toNode = to[j];

      if (random.nextDouble() < mingleProbability) {
        // Do not allow links between incorrect and correct nodes:
        if (!fromNode.isCorrect && toNode.isCorrect) continue;
        if (!graph.hasLink(fromNode.id, toNode.id)) graph.addLink(fromNode.id, toNode.id);
      }
    }
  }
}

function generateExpression(minValue, maxValue) {
  let first, second, operation, result;

  do {
    first = pickRandomInRange(minValue, maxValue);
    second = Math.round((random.nextDouble()) * 10);
    operation = allowedOperations[Math.floor(random.nextDouble() * allowedOperations.length)];
    result = computeResult(first, operation, second);
  } while (outOfRange(first) || outOfRange(result));

  return {
    first, second, operation, result
  }
  function outOfRange(x) {
    return x < minValue || x > maxValue;
  }
}

function connectLevels(from, to) {
  let availableIndices = [];
  let correctIndex;
  var randomIterator = randomAPI.randomIterator(to, random);
  randomIterator.shuffle();

  for (let i = 0; i < to.length; ++i) {
    if (to[i].isCorrect) correctIndex = i;
    else availableIndices.push(i);
  }

  if (correctIndex === undefined) throw new Error('Cannot find correct index in the to layer');
  let lastUsedIndex = 0;

  from.forEach(item => {
    if (item.isCorrect) {
      let toId = (to[correctIndex].id)
      graph.addLink(item.id, toId);
      // TODO: could validate that just one index is allowed.
    } else if (lastUsedIndex < availableIndices.length) {
      graph.addLink(item.id, (to[availableIndices[lastUsedIndex]].id));
      lastUsedIndex += 1;
    } else {
      throw new Error('Not enough incorrect answers on the layer');
    }
  });
}

function makeUnique(id) {
  let uniqueId = id;
  while (graph.getNode(uniqueId)) {
    uniqueId += ' ';
  }
  return uniqueId;
}

function toString(node) {
  return `${node.first} ${node.operation} ${node.second}`;
}

function computeResult(a, op, b) {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return a / b;
  }
  throw new Error('unknown operation ' + op);
}

function pickRandomInRange(minValue, maxValue) {
  return Math.round(random.nextDouble() * (maxValue - minValue)) + minValue;
}