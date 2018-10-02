import {START_ENDPOINT, FINISH_ENDPOINT, INTERSECT_ENDPOINT} from './eventTypes';

/**
 * Represents a single event in the sweep-line algorithm
 */
export default class SweepEvent {
  /**
   * Creates new sweep event of a given kind.
   */
  constructor(kind, point, segment) {
    this.kind = kind;
    // this.checkDuplicates = false;

    this.point = point;
    if (kind === START_ENDPOINT) {
      this.from = [segment];
    }
  }

  /**
   * TODO: Do I need to create event before merging? I think I can
   * save some RAM/CPU if I use pojo here.
   */
  merge(other) {
    //if (this.kind !== other.kind) this.checkDuplicates = true;

    if (other.kind === START_ENDPOINT) {
      if (!this.from) this.from = [];
      other.from.forEach(s => this.from.push(s));
    } 
    // else if (other.kind === FINISH_ENDPOINT) {
    //   if (!this.to) this.to = [];
    //   other.to.forEach(s => this.to.push(s));
    // } else if (other.kind === INTERSECT_ENDPOINT) {
    //   if (!this.interior) {
    //     this.interior = [];
    //     this.knownInterior = new Set();
    //   }

    //   other.interior.forEach(s => {
    //     // TODO: Need to not push if we already have such segments.
    //     if (!this.knownInterior.has(s)) {
    //       this.interior.push(s);
    //       this.knownInterior.add(s);
    //     }
    //   });
    // }
  }
}
