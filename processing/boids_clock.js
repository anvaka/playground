// Created by https://twitter.com/anvaka
let height = 400;
let width = 400;
let drawingAreaPadding = 20;
let numBoids = 42*2; // Number of boids

// Internal variables to share state
let boids = [];
let shouldRun = true;
let autoIncrement = true;

/**
 * Boid class represents a moving clock in the flocking simulation.
 * Each boid adjusts its time based on neighboring boids.
 */
class Boid {
  constructor() {
    // Flocking properties
    this.position = createVector(random(width), random(height));
    this.velocity = p5.Vector.random2D();
    this.velocity.setMag(random(2, 4));
    this.acceleration = createVector();
    this.maxForce = 0.2;
    this.maxSpeed = 2;

    // Clock properties
    let hh = random(12);
    let mm = random(60);
    let time = new Date(2024, 9, 21, hh, mm);
    this.time = time;
    this.target = time;
    this.durationInFrames = 1; // Animation frames
    this.t = this.durationInFrames;
    this.from = +this.time;
    this.diff = 0;

    // If boid is chosen, it does not adjust its time
    this.chosen = false;
  }

  edges() {
    // Wrap around the edges of the canvas
    if (this.position.x > width) this.position.x = 0;
    else if (this.position.x < 0) this.position.x = width;

    if (this.position.y > height) this.position.y = 0;
    else if (this.position.y < 0) this.position.y = height;
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  flock(boids) {
    // Apply flocking behaviors
    let alignment = this.align(boids);
    let cohesion = this.cohere(boids);
    let separation = this.separate(boids);

    alignment.mult(1.0);
    cohesion.mult(1.0);
    separation.mult(1.5);

    this.applyForce(alignment);
    this.applyForce(cohesion);
    this.applyForce(separation);
  }

  align(boids) {
    // Alignment behavior
    let perceptionRadius = 50;
    let steering = createVector();
    let total = 0;
    for (let other of boids) {
      let d = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y
      );
      if (other != this && d < perceptionRadius) {
        steering.add(other.velocity);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  cohere(boids) {
    // Cohesion behavior
    let perceptionRadius = 50;
    let steering = createVector();
    let total = 0;
    for (let other of boids) {
      let d = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y
      );
      if (other != this && d < perceptionRadius) {
        steering.add(other.position);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.sub(this.position);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  separate(boids) {
    // Separation behavior
    let perceptionRadius = 25;
    let steering = createVector();
    let total = 0;
    for (let other of boids) {
      let d = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y
      );
      if (other != this && d < perceptionRadius) {
        let diff = p5.Vector.sub(this.position, other.position);
        diff.div(d * d);
        steering.add(diff);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  update() {
    // Update position and velocity
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0);
  }

  adjustTime(boids) {
    // Adjust time based on neighboring boids
    if (this.chosen) {
      if (autoIncrement) this.advance();
      return;
    }

    let perceptionRadius = 50;
    let nearbyTimes = [];
    for (let other of boids) {
      let d = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y
      );
      if (other != this && d < perceptionRadius) {
        nearbyTimes.push(+other.time);
      }
    }
    if (nearbyTimes.length > 0) {
      let avg = round(
        nearbyTimes.reduce((prev, cur) => prev + cur, 0) / nearbyTimes.length
      );
      this.setTarget(new Date(Math.floor(avg)));
    }
  }

  animateToTarget() {
    // Smoothly transition to target time
    if (this.t > this.durationInFrames) return;
    this.t += 1;
    let t = easing(this.t / this.durationInFrames);

    let newTime = this.diff * t + this.from;
    this.time = new Date(newTime);
  }

  setTarget(newTarget) {
    if (newTarget - this.target == 0) return; // Already at target

    this.t = 0;
    this.from = +this.time;
    this.target = newTarget;
    this.diff = this.target - this.time;
  }

  advance() {
    // Advance time by one minute
    this.time.setMinutes(this.time.getMinutes() + 1);
  }

  render() {
    // Draw the boid and clock hands
    let hours = this.time.getHours() % 12;
    let minutes = this.time.getMinutes();

    let singleHourAngle = (2 * PI) / 12;
    let hAngle = singleHourAngle * (hours + minutes / 60) - PI / 2;
    let mAngle = (2 * PI * minutes) / 60 - PI / 2;

    // Boid's shape and color
    let r = 3; // Size of the boid
    push();
    translate(this.position.x, this.position.y);
    rotate(this.velocity.heading() + PI / 2);

    if (this.chosen) {
      fill(0xbf, 0x21, 0x72);
      stroke(255, 33, 255);
    } else {
      fill(255);
      stroke(255, 255, 255);
    }

    // Draw the clock hands
    // Hour hand
    line(0, 0, (r * 1.5) * cos(hAngle), (r * 1.5) * sin(hAngle));
    // Minute hand
    line(0, 0, (r * 2) * cos(mAngle), (r * 2) * sin(mAngle));
    fill(0, 0, 0, 0);
    stroke(255, 255, 255, 24)
    circle(0, 0, 5 * r);
    pop();
  }
}


function easing(x) {
  return x; // Linear easing
}

function setup() {
  createCanvas(2 * width, height);
  resetBoids();
}

function resetBoids() {
  boids = [];
  for (let i = 0; i < numBoids; i++) {
    let b = new Boid();
    boids.push(b);
  }
  boids[floor(random() * numBoids)].chosen = true;
}

function draw() {
  background(10, 40, 50);
  fill(255);

  for (let boid of boids) {
    boid.edges();
    boid.flock(boids);
    boid.update();

    if (shouldRun) {
      boid.adjustTime(boids);
      boid.animateToTarget();
    }
    boid.render();
  }
}
