var measureText = require('./measureText.js');

module.exports = getWordBox;

function getWordBox(wordLayoutModel) {
  return measureText(wordLayoutModel); 
}
