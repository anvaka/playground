module.exports = WordLayoutModel;

function WordLayoutModel(word, fontFamily) {
  this.text = word[0];
  this.position = new Point(0, 0);
  this.transform = new Transform();
  this.fontSize = word[1];
  this.color = 'black';
  this.fontFamily = fontFamily || 'sans-serif';
  this.fontWeight = 'normal';
  this.isVertical = false;
}

WordLayoutModel.prototype = {
  setSpot: setSpot
};

function Transform() {
  this.scale = 1;
  this.rotate = 0;
  this.translate = new Point();
}

function Point(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}

function setSpot(spot) {
  this.transform.translate.x = spot.x;
  this.transform.translate.y = spot.y;
  this.height = spot.height;
  this.width = spot.width;
}
