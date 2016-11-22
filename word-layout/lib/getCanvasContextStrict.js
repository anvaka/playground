/* glboals document */
module.exports = validateSupported;

function validateSupported() {
  var canvas = document.createElement('canvas');
  if (!canvas || !canvas.getContext) throw new Error('canvas is not supported')

  var ctx = canvas.getContext('2d');
  if (!ctx.getImageData) throw new Error('getImageData is required');

  if (!ctx.fillText) throw new Error('fillText is required');

  // canvas.setAttribute('width', 800);
  // canvas.setAttribute('height', 800);
  // document.body.appendChild(canvas);
  return ctx;
}
