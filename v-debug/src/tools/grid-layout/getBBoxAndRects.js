const BBox = require('../../lib/geom/BBox');
const forEachRectangleNode = require('./forEachRectangle');

module.exports = getBBoxAndRects;

function getBBoxAndRects(graph, layout) {
  let rects = [];
  let bbox = new BBox();

  forEachRectangleNode(graph, layout, rect => {
    bbox.addRect(rect);
    rects.push(rect);
  });

  return {
    rects, bbox
  };
}