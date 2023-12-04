export class Intersection {
  constructor(t, object) {
    this.t = t;
    this.object = object;
  }

  static intersections(...intersections) {
    return intersections.sort((a, b) => a.t - b.t);
  }

  static hit(intersections) {
    return intersections.find(i => i.t >= 0) || null;
  }
}