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

  updateBBox(childBbox) {
    // TODO: This should use transform.
    this.bbox.merge(childBbox);
    if (this.parent) {
      this.parent.updateBBox(this.bbox);
    }
  }

  draw(gl, screen, parentTransform) {
    if (!parentTransform) {
      parentTransform = new Transform(1, 0, 0);
    } 

    var currentTransform = parentTransform.applyTransform(this.transform);

    for (var i = 0; i < this.children.length; ++i) {
      var child = this.children[i];
      child.draw(gl, screen, currentTransform);
    }
  }
}

module.exports = Element;