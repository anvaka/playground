import readline from 'readline'
import createExpressionParser from './createExpressionParser.js';
import {createVectorLookupServer, createNNLookupServer} from './createFastTextServer.js'

const normalize = true;
const ft = createVectorLookupServer()
const nn = createNNLookupServer();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

processNext();

function processNext() {
  getExpression((answer) => {
    try {
      const expression = createExpressionParser(answer);
      let store = new Set();
      expression.collectNames(store);

      resolveAllNames(Array.from(store)).then(scope => {
        let finalVector = expression.evaluate(scope)
        return nn.sendMessage(finalVector)
      }).then((res) => {
        console.log(res)
        processNext();
      })
    } catch(e) {
      console.error('Failed to parse your expression: ' + e.message);
      processNext();
    }
  });
}
// This function asks the user for an expression and calls the callback on it
function getExpression(callback) {
  rl.question('Enter an expression: ', (answer) => {
    callback(answer);
  });
}


function resolveAllNames(names) {
  let current = 0;
  let resolved = new Map();
  return resolveNext();

  function resolveNext() {
    if (current >= names.length) return Promise.resolve(resolved);
    let word = names[current];
    return ft.sendMessage(word).then((v) => {
      if (v.word !== word) {
        throw new Error('Unexpected response from fasttext server: ' + v.word);
      }
      if (normalize) {
        normalizeVector(v.data);
      }

      resolved.set(word, v.data);
      current += 1;
      return resolveNext();
    });
  }
}

function normalizeVector(v) {
  let sum = 0;
  for (let i = 0; i < v.length; i++) {
    sum += v[i] * v[i];
  }
  sum = Math.sqrt(sum);
  for (let i = 0; i < v.length; i++) {
    v[i] /= sum;
  }
}