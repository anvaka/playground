var eventify = require('ngraph.events');
var measureText = require('./lib/measureText.js');
var makeGrid = require('./lib/makeGrid.js');
var WordLayoutModel = require('./lib/WordLayoutModel.js');

module.exports = wordCloud;

function wordCloud(words, settings) {
  words.sort(bySize);

  var grid = makeGrid(settings.width || 400, settings.height || 400);
  var lastProcessedWordIndex = 0;
  var api = {
    mask: grid.mask
  }

  eventify(api);

  setTimeout(loop, 0);

  return api;

  function loop() {
    if (lastProcessedWordIndex < words.length - 1) {
      setTimeout(loop, 0);
    }
    var word = words[lastProcessedWordIndex];
    var wordPosition = findPosition(word);
    if (wordPosition) triggerPositionFound(wordPosition);

    lastProcessedWordIndex += 1;
  }

  function findPosition(word) {
    var wordPosition = new WordLayoutModel(word, settings.fontFamily);
    console.time('measure ' + word[0])
    var box = measureText(wordPosition)
    console.timeEnd('measure ' + word[0])
    if (!box) return;

    console.time('spot ' + word[0])
    var spot = grid.findSpot(box)
    console.timeEnd('spot ' + word[0])

    if (spot) {
      grid.useSpot(spot);
      wordPosition.setSpot(spot);

      return wordPosition;
    }
  }

  function triggerPositionFound(word) {
    api.fire('position', word);
  }
}


function bySize(x, y) {
  // element at position 1 is font size.
  return y[1] - x[1];
}
