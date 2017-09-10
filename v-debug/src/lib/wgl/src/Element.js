var Transform = require('./Transform')

/**
 * represents a single element in the scene tree
 */
class Element {
  constructor() {
    this.children = [];
    this.transform = new Transform();

    // Stores transformation to the "world" coordinates. If this element has
    // no parent, this object is equal to `this.transform`
    this.worldTransform = new Transform();
    this.worldTransformNeedsUpdate = true;
  }

  addInteractiveElements(tree, dx = 0, dy = 0) {
    let children = this.children;
    dx += this.transform.dx;
    dy += this.transform.dy;
    for (var i = 0; i < children.length; i++ ) {
       children[i].addInteractiveElements(tree, dx, dy);
    }
  }

  appendChild(child, sendToBack) {
    child.parent = this;
    if (sendToBack) {
      // back of z-index
      this.children.unshift(child);
    } else {
      this.children.push(child);
    }
  }

  removeChild(child) {
    // TODO: should this be faster?
    let childIdx = this.children.indexOf(child);
    if (childIdx > -1) {
      this.children.splice(childIdx, 1);
    }
  }

  updateWorldTransform(force) {
    if (this.worldTransformNeedsUpdate || force) {
      if (!this.parent) {
        this.transform.copyTo(this.worldTransform);
      } else {
        this.worldTransform.multiply(this.parent.worldTransform, this.transform)
      }

      this.worldTransformNeedsUpdate = false;
      force = true; // We have to update children now.
    }

    let wasDirty = force;

    var children = this.children;
    for (var i = 0; i < children.length; i++ ) {
       wasDirty = children[i].updateWorldTransform(force) || wasDirty;
    }

    return wasDirty;
  }

  draw(gl, screen) {
    for (var i = 0; i < this.children.length; ++i) {
      var child = this.children[i];
      child.draw(gl, screen);
    }
  }

  dispose() {
    for (var i = 0; i < this.children.length; ++i) {
      var child = this.children[i];
      child.dispose();
    }
  }
}

module.exports = Element;