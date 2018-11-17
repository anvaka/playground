// https://processing.org/examples/flocking.html

var random = require('ngraph.random')(45);

export class Flock {
  constructor(graph) {
    this.graph = graph;
    this.boids = new Map();
    this.neighbors = [];
  }

  run() {
    this.neighbors.forEach(b => b.run(this.neighbors));
    // let boids = this.boids;
    // boids.forEach((boid, nodeId) => {
    //   let neighbors = [];
    //   this.graph.forEachLinkedNode(nodeId, function(other) {
    //     let otherBoid = boids.get(other.id);
    //     if (otherBoid) neighbors.push(otherBoid);
    //   })
    //   boid.run(neighbors);
    // });
  }

  addBoid(nodeId, b) {
    this.boids.set(nodeId, b);
    this.neighbors.push(b);
  }
}

class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  static sub(a, b) {
    return new Vector(a.x - b.x, a.y - b.y);
  }

  static dist(a, b) {
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  normalize() {
    let l = Math.sqrt(this.x * this.x + this.y * this.y);
    if (l === 0) l = 0.0001;

    this.x /= l;
    this.y /= l;
  }

  mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  add(other) {
    this.x += other.x;
    this.y += other.y;
  }

  sub(other) {
    this.x -= other.x;
    this.y -= other.y;
  }

  div(scalar) {
    this.x /= scalar;
    this.y /= scalar;
  }

  mult(scalar) {
    this.x *= scalar;
    this.y *= scalar;
  }

  limit(maxMag) {
    let mag = this.mag();
    if (mag > maxMag) {
      this.x *= maxMag / mag;
      this.y *= maxMag / mag;
    }
  }

  distanceTo(other) {
    let dx = this.x - other.x;
    let dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

export class Boid {
  constructor(x, y) {
    this.acceleration = new Vector(0, 0);

    // Leaving the code temporarily this way so that this example runs in JS
    let angle = random.nextDouble() * 2 * Math.PI;
    this.velocity = new Vector(Math.cos(angle), Math.sin(angle));
    this.position = new Vector(x, y);
    this.r = 500.0;
    this.maxspeed = 2;
    this.maxforce = 0.03;
  }

  run(boids) {
    this.flock(boids);
    this.borders();
    this.update();
  }

  applyForce(force) {
    // We could add mass here if we want A = F / M
    this.acceleration.add(force);
  }

  // We accumulate a new acceleration each time based on three rules
  flock(boids) {
    let sep = this.separate(boids);   // Separation
    let ali = this.align(boids);      // Alignment
    let coh = this.cohesion(boids);   // Cohesion
    // Arbitrarily weight these forces
    sep.mult(1.5);
    ali.mult(1.0);
    coh.mult(1.0);
    // Add the force vectors to acceleration
    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
  }

  // Method to update position
  update() {
    // Update velocity
    this.velocity.add(this.acceleration);
    // Limit speed
    this.velocity.limit(this.maxspeed);
    this.position.add(this.velocity);
    // Reset acceleration to 0 each cycle
    this.acceleration.mult(0);
  }

  // A method that calculates and applies a steering force towards a target
  // STEER = DESIRED MINUS VELOCITY
  seek(target) {
    const desired = Vector.sub(target, this.position);  // A vector pointing from the position to the target
    // Scale to maximum speed
    desired.normalize();
    desired.mult(this.maxspeed);

    // Steering = Desired minus Velocity
    let steer = Vector.sub(desired, this.velocity);
    steer.limit(this.maxforce);  // Limit to maximum steering force
    return steer;
  }

  // Wraparound
  borders() {
    if (this.position.x < -this.r) this.velocity.x *= -1;
    if (this.position.y < -this.r) this.velocity.y *= -1;
    if (this.position.x > this.r) this.velocity.x *= -1;
    if (this.position.y > this.r) this.velocity.y *= -1;
  }

  // Separation
  // Method checks for nearby boids and steers away
  separate(boids) {
    const desiredseparation = 125.0;
    const steer = new Vector(0, 0, 0);
    let count = 0;
    // For every boid in the system, check if it's too close
    boids.forEach((other) => {
      let d = this.position.distanceTo(other.position);
      // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
      if ((d > 0) && (d < desiredseparation)) {
        // Calculate vector pointing away from neighbor
        let diff = Vector.sub(this.position, other.position);
        diff.normalize();
        diff.div(d);        // Weight by distance
        steer.add(diff);
        count++;            // Keep track of how many
      }
    });
    // Average -- divide by how many
    if (count > 0) {
      steer.div(count);
    }

    // As long as the vector is greater than 0
    if (steer.mag() > 0) {
      // Implement Reynolds: Steering = Desired - Velocity
      steer.normalize();
      steer.mult(this.maxspeed);
      steer.sub(this.velocity);
      steer.limit(this.maxforce);
    }
    return steer;
  }

  // Alignment
  // For every nearby boid in the system, calculate the average velocity
  align(boids) {
    const neighbordist = 150;
    const sum = new Vector(0, 0);
    let count = 0;
    boids.forEach(other => {
      let d = Vector.dist(this.position, other.position);
      if ((d > 0) && (d < neighbordist)) {
        sum.add(other.velocity);
        count++;
      }
    });

    if (count > 0) {
      sum.div(count);
      // Implement Reynolds: Steering = Desired - Velocity
      sum.normalize();
      sum.mult(this.maxspeed);
      let steer = Vector.sub(sum, this.velocity);
      steer.limit(this.maxforce);
      return steer;
    } 
    else {
      return new Vector(0, 0);
    }
  }

  // Cohesion
  // For the average position (i.e. center) of all nearby boids, calculate steering vector towards that position
  cohesion (boids) {
    const neighbordist = 150;
    let sum = new Vector(0, 0);   // Start with empty vector to accumulate all positions
    let count = 0;
    boids.forEach(other => {
      let d = Vector.dist(this.position, other.position);
      if ((d > 0) && (d < neighbordist)) {
        sum.add(other.position); // Add position
        count++;
      }
    })

    if (count > 0) {
      sum.div(count);
      return this.seek(sum);  // Steer towards the position
    } 
    else {
      return new Vector(0, 0);
    }
  }
}