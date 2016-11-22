module.exports = getTextInfo;

function getTextInfo(word, fontSize, scaleFactor, rotateDeg, settings) {
  var g = settings.gridSize;
  var fcanvas = document.createElement('canvas');
  var fctx = fcanvas.getContext('2d', { willReadFrequently: true });

  fctx.font = settings.fontWeight + ' ' + (fontSize * scaleFactor).toString(10) + 'px ' + settings.fontFamily;

  // Estimate the dimension of the text with measureText().
  var fw = fctx.measureText(word).width / scaleFactor;
  var fh = Math.max(fontSize * scaleFactor, fctx.measureText('m').width, fctx.measureText('\uFF37').width) / scaleFactor;

  // Create a boundary box that is larger than our estimates,
  // so text don't get cut of (it sill might)
  var boxWidth = fw + fh * 2;
  var boxHeight = fh * 3;
  var fgw = Math.ceil(boxWidth / g);
  var fgh = Math.ceil(boxHeight / g);
  boxWidth = fgw * g;
  boxHeight = fgh * g;

  // Calculate the proper offsets to make the text centered at
  // the preferred position.

  // This is simply half of the width.
  var fillTextOffsetX = - fw / 2;
  // Instead of moving the box to the exact middle of the preferred
  // position, for Y-offset we move 0.4 instead, so Latin alphabets look
  // vertical centered.
  var fillTextOffsetY = - fh * 0.4;

  // Calculate the actual dimension of the canvas, considering the rotation.
  var cgh = Math.ceil((boxWidth * Math.abs(Math.sin(rotateDeg)) + boxHeight * Math.abs(Math.cos(rotateDeg))) / g) + 5;
  var cgw = Math.ceil((boxWidth * Math.abs(Math.cos(rotateDeg)) + boxHeight * Math.abs(Math.sin(rotateDeg))) / g) + 5;
  var width = cgw * g;
  var height = cgh * g;

  fcanvas.setAttribute('width', width + 'px');
  fcanvas.setAttribute('height', height + 'px');

  // Scale the canvas with |scaleFactor|.
  fctx.scale(1 / scaleFactor, 1 / scaleFactor);
  fctx.translate(width * scaleFactor / 2, height * scaleFactor / 2);
  fctx.rotate(- rotateDeg);

  // Once the width/height is set, ctx info will be reset.
  // Set it again here.
  fctx.font = settings.fontWeight + ' ' + (fontSize * scaleFactor) + 'px ' + settings.fontFamily;

  // Fill the text into the fcanvas.
  // XXX: We cannot because textBaseline = 'top' here because
  // Firefox and Chrome uses different default line-height for canvas.
  // Please read https://bugzil.la/737852#c6.
  // Here, we use textBaseline = 'middle' and draw the text at exactly
  // 0.5 * fontSize lower.
  fctx.fillStyle = '#000';
  // fctx.textBaseline = 'middle';
  fctx.fillText(word, fillTextOffsetX * scaleFactor,
                (fillTextOffsetY + fontSize * 0.5) * scaleFactor);

  // Get the pixels of the text
  var imageData = fctx.getImageData(0, 0, width, height).data;

  // Read the pixels and save the information to the occupied array
  var occupied = [];
  var gx = cgw, gy, x, y;
  var bounds = [cgh / 2, cgw / 2, cgh / 2, cgw / 2];
  while (gx--) {
    gy = cgh;
    while (gy--) {
      y = g;
      singleGridLoop: {
        while (y--) {
          x = g;
          while (x--) {
            if (imageData[((gy * g + y) * width + (gx * g + x)) * 4 + 3]) {
              occupied.push([gx, gy]);

              if (gx < bounds[3]) {
                bounds[3] = gx;
              }
              if (gx > bounds[1]) {
                bounds[1] = gx;
              }
              if (gy < bounds[0]) {
                bounds[0] = gy;
              }
              if (gy > bounds[2]) {
                bounds[2] = gy;
              }

              break singleGridLoop;
            }
          }
        }
      }
    }
  }

  // Return information needed to create the text on the real canvas
  return {
    scaleFactor: scaleFactor,
    occupied: occupied,
    bounds: bounds,
    gw: cgw,
    gh: cgh,
    fillTextOffsetX: fillTextOffsetX,
    fillTextOffsetY: fillTextOffsetY,
    fillTextWidth: fw,
    fillTextHeight: fh,
    fontSize: fontSize
  };
}
