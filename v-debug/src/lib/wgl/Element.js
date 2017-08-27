var Transform = require('./Transform')
var BBox = require('./BBox')

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
    this.worldTransformNeedsUpdate = false;
  }

  addInteractiveElements(tree, dx = 0, dy = 0) {
    let children = this.children;
    dx += this.transform.dx;
    dy += this.transform.dy;
    for (var i = 0; i < children.length; i++ ) {
       children[i].addInteractiveElements(tree, dx, dy);
    }
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

  computeBoundingBox() {
    // TODO This should probably compute bbox in the world coordinates, and then
    // transform it back?
    var bbox = new BBox()
    if (this.bbox) {
      bbox.merge()
    }

    for (var i = 0; i < this.children.length; ++i) {
      var child = this.children[i];
      var childBBox = child.computeBoundingBox();
      bbox.merge(childBBox)
    }

    return bbox;
  }

  dispose() {
    for (var i = 0; i < this.children.length; ++i) {
      var child = this.children[i];
      child.dispose();
    }
  }
}

module.exports = Element;