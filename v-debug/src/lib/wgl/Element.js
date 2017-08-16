var BBox = require('./BBox');
var Transform = require('./Transform')

/**
 * represents a single element in the scene tree
 */
class Element {
  constructor() {
    this.bbox = new BBox();
    this.children = [];
    this.transform = new Transform();

    // Stores transformation to the "world" coordinates. If this element has
    // no parent, this object is equal to `this.transform`
    this.worldTransform = new Transform();
    this.worldTransformNeedsUpdate = false;
  }

  appendChild(child) {
    child.parent = this;
    this.children.push(child);
  }

  removeChild(child) {
    // TODO: should this be faster?
    let childIdx = this.children.indexOf(child);
    this.children.splice(childIdx, 1);
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

    var children = this.children;
    for (var i = 0; i < children.length; i++ ) {
       children[i].updateWorldTransform(force);
    }
  }

  updateBBox(childBbox) {
    // TODO: This should use transform.
    this.bbox.merge(childBbox);
    if (this.parent) {
      this.parent.updateBBox(this.bbox);
    }
  }

  draw(gl, screen) {
    for (var i = 0; i < this.children.length; ++i) {
      var child = this.children[i];
      child.draw(gl, screen);
    }
  }
}

module.exports = Element;