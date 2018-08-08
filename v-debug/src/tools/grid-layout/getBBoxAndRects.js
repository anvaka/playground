import BBox from '../../lib/geom/BBox';
import forEachRectangleNode from './forEachRectangle';

export default getBBoxAndRects;

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