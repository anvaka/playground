import {Element} from 'w-gl';
import Color from 'w-gl/src/Color';
import makeLineStripProgram from './makeLineStripProgram';


export default class LineStripCollection extends Element {
  constructor(capacity) {
    super();

    this.drawCount = 0;
    this.madeFullCircle = false;

    this.itemsPerLine = 3;
    this.capacity = capacity;
    this.nextElementIndex = 1;
    this._program = null;
    this.color = new Color(1, 1, 1, 1);
    this.buffer = new Float32Array((capacity + 1) * this.itemsPerLine);
  }

  draw(gl, screen) {
    if (!this._program) {
      this._program = makeLineStripProgram(gl, this.buffer);
    }
    let transform = this.worldTransform;

    this._program.draw(transform, this.color, screen, this.nextElementIndex, this.madeFullCircle);
  }

  add(x, y) {
    var offset = this.nextElementIndex * this.itemsPerLine;
    this.buffer[offset] = x;
    this.buffer[offset + 1] = y;
    this.buffer[offset + 2] = (this.nextElementIndex % 10);
    this.nextElementIndex += 1;
    this.drawCount += 1;

    if (this.nextElementIndex > this.capacity) {
      this.nextElementIndex = 1;
      this.buffer[0] = x;
      this.buffer[0 + 1] = y;
      this.buffer[0 + 2] = this.buffer[offset + 2];
      this.madeFullCircle = true;
    }
  }

  dispose() {
    if (this._program) {
      this._program.dispose();
      this._program = null;
    }
  }
}