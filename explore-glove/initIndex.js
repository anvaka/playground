const Annoy = require('annoy');

module.exports = initIndex;

function initIndex() {
  let annoyIndex;
  let inFile = './glove.6B.300d.txt';
  inFile = 'wiki-news-300d-1M.vec'
  let wordToIndex = new Map();
  let indexToWord = [];
  let dimensions;

  let api = { getVector, findNearest };

  return new Promise(resolve => {
    const lineReader = require('readline').createInterface({
      input: require('fs').createReadStream(inFile)
    });
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    lineReader
      .on('line', function(line) {
        let parts = line.split(' ');
        if (parts.length < 4) return; // first line

        let index = wordToIndex.size;
        let word = parts[0];
        let vector = parts
          .slice(1, parts.length)
          .map(x => Number.parseFloat(x));

        vector.forEach(el => {
          if (el < min) min = el;
          if (el > max) max = el;
        });
        wordToIndex.set(word, index);
        indexToWord[index] = word;

        if (index === 0) {
          dimensions = vector.length;
          annoyIndex = new Annoy(dimensions, 'Angular');
        }
        annoyIndex.addItem(index, vector);
      })
      .on('close', () => {
        console.log('range: ', min, max);
        annoyIndex.build();
        resolve(api);
      });
  });

  function getVector(word) {
    const index = wordToIndex.get(word);
    if (index === undefined) return;
    return annoyIndex.getItem(index);
  }
  function findNearest(vector, count) {
    let neighbors = annoyIndex.getNNsByVector(vector, count, -1, true);
    let distances = neighbors.distances;

    return neighbors.neighbors.map((wordIndex, i) => {
      let res = {
        word: indexToWord[wordIndex],
        distance: distances[i]
      };
      return res;
    });
  }
}
