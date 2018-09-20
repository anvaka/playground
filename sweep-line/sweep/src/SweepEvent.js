import {EPS} from './geom';
import {START_ENDPOINT, FINISH_ENDPOINT, INTERSECT_ENDPOINT} from './eventTypes';

/**
 * Represents a single event in the sweep-line algorithm
 */
export default class SweepEvent {
  constructor(kind, point, segment, oneMore) {
    this.kind = kind;
    this.checkDuplicates = false;
    if (Math.abs(point.x) < EPS) point.x = 0;
    if (Math.abs(point.y) < EPS) point.y = 0;

    this.point = point;
    if (kind === START_ENDPOINT) {
      this.from = [segment];
    } else if (kind === FINISH_ENDPOINT) {
      this.to = [segment]
    } else if (kind === INTERSECT_ENDPOINT) {
      this.interior = [segment, oneMore];
      this.knownInterior = new Set();
      this.interior.forEach(l => this.knownInterior.add(l));
    }
  }

  merge(other) {
    if (this.kind !== other.kind) this.checkDuplicates = true;

    if (other.kind === START_ENDPOINT) {
      if (!this.from) this.from = [];
      other.from.forEach(s => this.from.push(s));
    } else if (other.kind === FINISH_ENDPOINT) {
      if (!this.to) this.to = [];
      other.to.forEach(s => this.to.push(s));
    } else if (other.kind === INTERSECT_ENDPOINT) {
      if (!this.interior) {
        this.interior = [];
        this.knownInterior = new Set();
      }

      other.interior.forEach(s => {
        // TODO: Need to not push if we already have such segments.
        if (!this.knownInterior.has(s)) {
          this.interior.push(s);
          this.knownInterior.add(s);
        }
      });
    }
  }
}
