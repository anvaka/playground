module.exports = getMask;

function getMask(text, width, height) {
  var c = document.createElement('canvas');
  var ctx = c.getContext('2d');

  c.setAttribute('width', width);
  c.setAttribute('height', height);

  ctx.font = 'normal 400px sans-serif';
  ctx.fillStyle = 'red';
  ctx.textBaseline='top';
  ctx.fillText(text, 0, 0);

  var occupied = new Uint32Array(width * height);
  var imageData = ctx.getImageData(0, 0, width, height).data;

  for (var y = 0; y < height; ++y) {
    var offset = y * width;
    for (var x = 0; x < width; ++x) {
      occupied[offset + x] = imageData[(offset + x ) * 4] === 255 ? 0 : 1
    }
  }

  return {
    occupied: occupied,
    width: width,
    height: height
  };
}
