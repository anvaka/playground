var eventify = require('ngraph.events');
var measureText = require('./lib/measureText.js');
var makeGrid = require('./lib/makeGrid.js');
var WordLayoutModel = require('./lib/WordLayoutModel.js');
var getMask = require('./lib/getMask.js');
var indexMask = require('./lib/indexMask.js');

module.exports = wordCloud;


function wordCloud(words, settings) {
  words.sort(bySize);


  var mask = getMask('1876', settings.width || 1200, settings.height || 600)
  var maskIndex = indexMask(mask);
  var grid = makeGrid(maskIndex);

  var lastProcessedWordIndex = 0;
  var api = {
    maskIndex: maskIndex
  }

  eventify(api);

  setTimeout(loop, 0);

  return api;

  function loop() {
    if (lastProcessedWordIndex < words.length - 1) {
      setTimeout(loop, 0);
    }
    var word = words[lastProcessedWordIndex];
    console.time('find ' + word[0])
    var wordPosition = findPosition(word);
    console.timeEnd('find ' + word[0])
    if (wordPosition) triggerPositionFound(wordPosition);

    lastProcessedWordIndex += 1;
  }

  function findPosition(word) {
    var wordPosition = new WordLayoutModel(word, settings.fontFamily);
    var box = measureText(wordPosition)
    if (!box) return;

    var spot = grid.findSpot(box)

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
