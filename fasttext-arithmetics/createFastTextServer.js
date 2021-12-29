import {spawn} from 'child_process';
const ftPath = '/Users/anvaka/projects/other/fastText/'

export function createVectorLookupServer() {
  let server = runCommand(ftPath + 'fasttext', ['print-word-vectors', ftPath + '/result/fil9.bin']);
  let currentWord;
  let currentData;

  return {
    sendMessage: (message) => {
      return server.sendMessage(message).then((data) => {
        currentWord = null;
        currentData = [];
        data.toString().trim().split(' ').forEach((x, index, arr) => {
          if (index === 0) {
            currentWord = x;
            return;
          } 
          let num = Number.parseFloat(x);
          if (!Number.isFinite(num)) {
            currentReject('Number ' + num + ' is not finite in ' + data + ' value was: ' + x);
          }
          currentData.push(num);
        });
        return {word: currentWord, data: currentData};
      });
    }
  };
}

export function createNNLookupServer(verbose) {
  let server = runCommand(ftPath + 'fasttext', ['nn-vec', ftPath + '/result/fil9.bin'], verbose);
  return {
    sendMessage: (message) => {
      return server.sendMessage(message.join('\n') + '\n').then(data => {
        let word, score;
        let pairs = [];
        data.toString().trim().split(' ').forEach((x, index, arr) => {
          if (index % 2 === 0) {
            word = x;
          } else {
            let num = Number.parseFloat(x);
            if (!Number.isFinite(num)) {
              throw new Error('Number ' + num + ' is not finite in ' + data + ' value was: ' + x);
            }
            score = num;
            pairs.push({word, score});
          }
        });
        return pairs;
      })
    }
  };
}
  
function runCommand(command, args, verbose = false) {
  let currentResolve = null;
  let currentReject = null;

  const vectorLookupProcess = spawn(command, args);
  vectorLookupProcess.stdout.on('data', (data) => {
    if (verbose) console.log(`stdout: ${data}`);
    currentResolve(data);
    currentResolve = null;
  });
  vectorLookupProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
    currentReject();
    currentResolve = null;
  });
  vectorLookupProcess.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });

  return {
    sendMessage: (message) => {
      if (currentResolve) {
        throw new Error('Cannot send message while waiting for response');
      }

      return new Promise((resolve, reject) => {
        currentResolve = resolve;
        currentReject = reject;
        vectorLookupProcess.stdin.write(message + '\n');
      });
    }
  }
}

function debounce(cb, timeout = 50) {
  let handle;
  return function() {
    if (handle) clearTimeout(handle);
    handle = setTimeout(cb, timeout);
  };
}