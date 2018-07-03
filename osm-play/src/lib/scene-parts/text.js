let wgl = require('w-gl');

export default class TextCanvasElement extends wgl.Element {
  constructor(ctx) {
    super();
    this.ctx = ctx;
    this.text = 'Hello world';
  }

  draw(ctx) {
    // ctx.fillText(this.text, 0, 20);
    ctx.fillRect(0, 0, 100, 20);
  }
}
