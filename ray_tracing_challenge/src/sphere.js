import { Matrix } from './matrix.js';
import { Point } from './tuple.js';
import { Intersection } from './intersection.js';

export class Sphere {
  constructor() {
    this.transform = Matrix.identity(4);
  }

  intersect(ray) {
    ray = ray.transform(this.transform.inverse());
    let sphereToRay = ray.origin.subtract(new Point(0, 0, 0));
    let a = ray.direction.dot(ray.direction);
    let b = 2 * ray.direction.dot(sphereToRay);
    let c = sphereToRay.dot(sphereToRay) - 1;
    let discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return [];
    let t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
    let t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
    return Intersection.intersections(
      new Intersection(t1, this), new Intersection(t2, this)
    );
  }

  normalAt(point) {
    let objectPoint = this.transform.inverse().multiply(point);
    let objectNormal = objectPoint.subtract(new Point(0, 0, 0));
    let worldNormal = this.transform.inverse().transpose().multiply(objectNormal);
    worldNormal.w = 0;
    return worldNormal.normalize();
  }
}