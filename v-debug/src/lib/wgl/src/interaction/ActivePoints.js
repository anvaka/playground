var Element = require('../Element');
var createTree = require('d3-quadtree').quadtree;

class ActivePoints extends Element {
  constructor(scene) {
    super();

    this.scene = scene;
    this.prevHighlighted = null;
    this.lastTreeUpdate = new Date();

    scene.on('mousemove', this.onMouseMove, this);
    scene.on('click', this.onClick, this);
  }

  findUnderCursor(x, y) {
    if (!this.interactiveTree) return;

    return this.interactiveTree.find(x, y, 10);
  }

  draw(gl, drawContext) {
    if (drawContext.wasDirty) {
      this.updateInteractiveTree();
    }
  }

  updateInteractiveTree() {
    var now = new Date();
    if (now - this.lastTreeUpdate < 500) return; 

    var interactiveTree = createTree().x(p => p.x).y(p => p.y);
    var transform = this.scene.getTransform();
    var sceneRoot = this.scene.getRoot();
    sceneRoot.addInteractiveElements(interactiveTree, -transform.dx, -transform.dy);

    this.interactiveTree = interactiveTree;

    this.lastTreeUpdate = new Date();
  }

  onMouseMove(event) {
    var e = event.originalEvent;

    var res = this.findUnderCursor(event.sceneX, event.sceneY);
    if (!res) {
      if (this.prevHighlighted) {
        this.scene.fire('point-leave', this.prevHighlighted);
        this.prevHighlighted = null;
      }
  
      return;
    }

    if (res === this.prevHighlighted) return;

    this.prevHighlighted = res;
    this.scene.fire('point-enter', this.prevHighlighted, {
      x: e.clientX,
      y: e.clientY
    });
  }

  onClick(event) {
    var e = event.originalEvent;
    var res = this.findUnderCursor(event.sceneX, event.sceneY);
    if (res) {
      this.scene.fire('point-click', res, {
        x: e.clientX,
        y: e.clientY
      });
    }
  }
}

module.exports = ActivePoints;