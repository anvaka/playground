/**
 * collects roads and adjust their thickness based on how often same route 
 * appears
 */

const createGraph = require('ngraph.graph');
const cellKey = require('./cellKey');

class RoadAccumulator {
  constructor() {
    this.graph = createGraph({ uniqueLinkId : false });
    this.maxSeen = 0;
  }

  addRoute(from, to) {
    let fromId = cellKey(from.x, from.y);
    let toId = cellKey(to.x, to.y);
    let link = this.graph.getLink(fromId, toId);
    if (!link) {
      link = this.graph.addLink(fromId, toId, {
        from: from,
        to: to, 
        seenTimes: 0
      });
    }

    link.data.seenTimes += 1;
    if (link.data.seenTimes > this.maxSeen) {
      this.maxSeen = link.data.seenTimes;
    }
  }

  getLines() {
    let lines = [];
    let maxSeen = this.maxSeen || 0;
    this.graph.forEachLink(link => {
      let bucket = Math.round((link.data.seenTimes / maxSeen) * 3)
      let width = bucket + 1;
      lines.push({
        width,
        from: link.data.from,
        to: link.data.to
      });
    });

    return lines;
  }
}



module.exports = RoadAccumulator;
