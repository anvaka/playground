module.exports = measureText;

var ctx, canvas;

function measureText(wordLayoutModel) {
  //if (!ctx) {
    initContext();
  //}

  var fontSize = wordLayoutModel.fontSize;
  var font = wordLayoutModel.fontWeight + ' ' + fontSize + 'px ' + wordLayoutModel.fontFamily;

  ctx.font = font;
  var textInfo = ctx.measureText(wordLayoutModel.text);
  var width = Math.ceil(textInfo.width);
  var height = Math.ceil(fontSize * 2);

  if (width === 0) return;
  canvas.setAttribute('width', width);
  canvas.setAttribute('height', height);

  ctx.font = font;
  ctx.fillStyle = 'red';
  ctx.textBaseline = 'top';
  ctx.fillText(wordLayoutModel.text, 0, 0);

  var imageData = ctx.getImageData(0, 0, width, height).data;
  var left = width;
  var top = height;
  var bottom = 0;
  var right = 0;
  var mask = new Uint8ClampedArray(width * height);

  for (var y = 0; y < height; ++y) {
    var offset = y * width;
    for (var x = 0; x < width; ++x) {
      if (imageData[(offset + x ) * 4] === 255) {
        mask[offset + x] = 1;

        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      } else {
        mask[offset + x] = 0;
      }
    }
  }

  return {
    width: width,
    originalHeight: height,
    height: Math.max(fontSize, bottom) + 1,
    mask: mask
  }
}

function initContext() {
  canvas = document.createElement('canvas');
  ctx = canvas.getContext('2d', { willReadFrequently: true });
  //document.body.appendChild(canvas);
}
