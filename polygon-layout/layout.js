class Edge {
  constructor(sourceNode, targetNode, optimalLength = 100) {
    this.sourceNode = sourceNode;
    this.targetNode = targetNode;
    this.optimalLength = optimalLength;
  }
}

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  distanceTo(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static add(p1, p2) {
    return new Point(p1.x + p2.x, p1.y + p2.y);
  }

  static subtract(p1, p2) {
    return new Point(p1.x - p2.x, p1.y - p2.y);
  }

  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Point(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }
}

export class Shape {
  constructor(relativePoints) {
    // relativePoints should include the center point (usually at 0,0)
    this.relativePoints = relativePoints;
    this.boundingRadius = Math.max(...relativePoints.map(p =>
      Math.sqrt(p.x * p.x + p.y * p.y)
    ));
  }

  static Rectangle(width, height) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    return new Shape([
      new Point(0, 0),  // center
      new Point(-halfWidth, -halfHeight),  // top-left
      new Point(halfWidth, -halfHeight),   // top-right
      new Point(halfWidth, halfHeight),    // bottom-right
      new Point(-halfWidth, halfHeight)    // bottom-left
    ]);
  }

  static Triangle(size) {
    const height = size * Math.sqrt(3) / 2;
    return new Shape([
      new Point(0, 0),  // center
      new Point(0, -height * 2 / 3),  // top
      new Point(-size / 2, height / 3),  // bottom-left
      new Point(size / 2, height / 3)   // bottom-right
    ]);
  }

  static Pentagon(radius) {
    const points = [new Point(0, 0)];  // center
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5;
      points.push(new Point(
        radius * Math.cos(angle),
        radius * Math.sin(angle)
      ));
    }
    return new Shape(points);
  }
}

export class Node {
  constructor(id, x, y, shape, rotation = 0) {
    this.id = id;
    this.center = new Point(x, y);
    this.shape = shape;
    this.rotation = rotation;
    this.velocity = { x: 0, y: 0 };
    this.angularVelocity = 0;
  }

  getAnchorPoints() {
    return this.shape.relativePoints.map(relPoint =>
      Point.add(this.center, relPoint.rotate(this.rotation))
    );
  }

  moveBy(dx, dy) {
    this.center.x += dx;
    this.center.y += dy;
  }

  rotate(dAngle) {
    this.rotation += dAngle;
  }

  collidesWith(other) {
    return this.center.distanceTo(other.center) <
      (this.shape.boundingRadius + other.shape.boundingRadius);
  }
}

export class ForceVisualizer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = 1;
    this.offset = { x: canvas.width / 2, y: canvas.height / 2 };
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawNode(node) {
    const ctx = this.ctx;
    const points = node.getAnchorPoints();

    // Draw shape
    ctx.beginPath();
    ctx.moveTo(
      this.offset.x + points[1].x * this.scale,
      this.offset.y + points[1].y * this.scale
    );
    for (let i = 2; i < points.length; i++) {
      ctx.lineTo(
        this.offset.x + points[i].x * this.scale,
        this.offset.y + points[i].y * this.scale
      );
    }
    ctx.closePath();
    ctx.strokeStyle = '#000';
    ctx.stroke();

    // Draw center point
    ctx.beginPath();
    ctx.arc(
      this.offset.x + points[0].x * this.scale,
      this.offset.y + points[0].y * this.scale,
      3, 0, 2 * Math.PI
    );
    ctx.fillStyle = 'red';
    ctx.fill();

    // Draw node ID
    ctx.fillStyle = '#000';
    ctx.fillText(node.id,
      this.offset.x + node.center.x * this.scale,
      this.offset.y + node.center.y * this.scale - 10
    );
  }

  drawEdge(edge) {
    const ctx = this.ctx;
    const source = edge.sourceNode.center;
    const target = edge.targetNode.center;

    ctx.beginPath();
    ctx.moveTo(
      this.offset.x + source.x * this.scale,
      this.offset.y + source.y * this.scale
    );
    ctx.lineTo(
      this.offset.x + target.x * this.scale,
      this.offset.y + target.y * this.scale
    );
    ctx.strokeStyle = '#666';
    ctx.stroke();

    // Draw optimal length indicator
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    const distance = source.distanceTo(target);
    ctx.fillStyle = distance > edge.optimalLength ? 'red' : 'green';
    ctx.fillText(
      Math.round(distance),
      this.offset.x + midX * this.scale,
      this.offset.y + midY * this.scale
    );
  }

  drawForce(point, force, color = 'blue') {
    const ctx = this.ctx;
    const scale = 50; // Scale factor for force visualization

    ctx.beginPath();
    ctx.moveTo(
      this.offset.x + point.x * this.scale,
      this.offset.y + point.y * this.scale
    );
    ctx.lineTo(
      this.offset.x + (point.x + force.x * scale) * this.scale,
      this.offset.y + (point.y + force.y * scale) * this.scale
    );
    ctx.strokeStyle = color;
    ctx.stroke();

    // Draw arrow head
    const angle = Math.atan2(force.y, force.x);
    const arrowLength = 10;
    ctx.beginPath();
    ctx.moveTo(
      this.offset.x + (point.x + force.x * scale) * this.scale,
      this.offset.y + (point.y + force.y * scale) * this.scale
    );
    ctx.lineTo(
      this.offset.x + (point.x + force.x * scale - arrowLength * Math.cos(angle - Math.PI / 6)) * this.scale,
      this.offset.y + (point.y + force.y * scale - arrowLength * Math.sin(angle - Math.PI / 6)) * this.scale
    );
    ctx.moveTo(
      this.offset.x + (point.x + force.x * scale) * this.scale,
      this.offset.y + (point.y + force.y * scale) * this.scale
    );
    ctx.lineTo(
      this.offset.x + (point.x + force.x * scale - arrowLength * Math.cos(angle + Math.PI / 6)) * this.scale,
      this.offset.y + (point.y + force.y * scale - arrowLength * Math.sin(angle + Math.PI / 6)) * this.scale
    );
    ctx.stroke();
  }
}

export class ForceDirectedGraph {
  constructor(config = {}) {
    this.config = {
      centerPointWeight: 2.0,
      maxEdgeLength: 200,
      forceDecayRate: 0.5,
      repulsionStrength: 1000,
      attractionStrength: 0.5,
      damping: 0.8,
      deltaTime: 0.1,
      angularDamping: 0.5,
      torqueStrength: 0.1,
      ...config
    };

    this.nodes = new Map();
    this.edges = new Set();
    this.visualizer = null;
  }

  setVisualizer(visualizer) {
    this.visualizer = visualizer;
  }

  addNode(node) {
    this.nodes.set(node.id, node);
  }

  addEdge(source, target, optimalLength) {
    const edge = new Edge(source, target, optimalLength);
    this.edges.add(edge);
  }

  calculateForces() {
    const forces = new Map();
    const torques = new Map();

    // Initialize forces and torques for each node
    for (const node of this.nodes.values()) {
      forces.set(node.id, { x: 0, y: 0 });
      torques.set(node.id, 0);
    }

    // Calculate forces between all anchor points
    const nodes = Array.from(this.nodes.values());
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];

        const points1 = node1.getAnchorPoints();
        const points2 = node2.getAnchorPoints();

        // Calculate forces between all pairs of points
        for (let p1 = 0; p1 < points1.length; p1++) {
          for (let p2 = 0; p2 < points2.length; p2++) {
            const force = this.calculateRepulsion(points1[p1], points2[p2]);
            const weight = (p1 === 0 || p2 === 0) ?
              this.config.centerPointWeight : 1.0;

            // Apply force to node centers
            const force1 = forces.get(node1.id);
            const force2 = forces.get(node2.id);

            force1.x += force.x * weight;
            force1.y += force.y * weight;
            force2.x -= force.x * weight;
            force2.y -= force.y * weight;

            // Calculate torques
            if (p1 !== 0) {  // Skip center point for torque
              const r1 = Point.subtract(points1[p1], node1.center);
              torques.set(node1.id,
                torques.get(node1.id) +
                (r1.x * force.y - r1.y * force.x) * this.config.torqueStrength
              );
            }
            if (p2 !== 0) {
              const r2 = Point.subtract(points2[p2], node2.center);
              torques.set(node2.id,
                torques.get(node2.id) -
                (r2.x * force.y - r2.y * force.x) * this.config.torqueStrength
              );
            }
          }
        }
      }
    }

    // Calculate attraction forces for edges
    for (const edge of this.edges) {
      const attractionForce = this.calculateAttractionForce(edge);

      // Apply attraction forces to connected nodes
      const sourceForce = forces.get(edge.sourceNode.id);
      const targetForce = forces.get(edge.targetNode.id);

      sourceForce.x += attractionForce.x;
      sourceForce.y += attractionForce.y;
      targetForce.x -= attractionForce.x;
      targetForce.y -= attractionForce.y;

      // If visualizer is enabled, draw attraction forces in a different color
      if (this.visualizer) {
        this.visualizer.drawForce(
          edge.sourceNode.center,
          attractionForce,
          'green'  // Use different color for attraction forces
        );
      }
    }
    return { forces, torques };
  }

  step() {
    const { forces, torques } = this.calculateForces();

    // Update positions and velocities
    for (const node of this.nodes.values()) {
      const force = forces.get(node.id);
      const torque = torques.get(node.id);

      // Update linear velocity and position
      node.velocity.x = node.velocity.x * this.config.damping +
        force.x * this.config.deltaTime;
      node.velocity.y = node.velocity.y * this.config.damping +
        force.y * this.config.deltaTime;

      node.moveBy(
        node.velocity.x * this.config.deltaTime,
        node.velocity.y * this.config.deltaTime
      );

      // Update angular velocity and rotation
      node.angularVelocity = node.angularVelocity * this.config.angularDamping +
        torque * this.config.deltaTime;
      node.rotate(node.angularVelocity * this.config.deltaTime);
    }

    // Handle collisions
    this.handleCollisions();

    // Update visualization if available
    if (this.visualizer) {
      this.visualizer.clear();

      // Draw edges
      for (const edge of this.edges) {
        this.visualizer.drawEdge(edge);
      }

      // Draw nodes
      for (const node of this.nodes.values()) {
        this.visualizer.drawNode(node);

        // Optionally draw forces
        const force = forces.get(node.id);
        this.visualizer.drawForce(node.center, force);
      }
    }
  }

  calculateAttractionForce(edge) {
    const source = edge.sourceNode.center;
    const target = edge.targetNode.center;
    const distance = source.distanceTo(target);

    if (distance === 0) return { x: 0, y: 0 };

    const dx = target.x - source.x;
    const dy = target.y - source.y;
    let force;

    if (distance <= edge.optimalLength) {
      // Linear attraction when shorter than optimal length
      force = this.config.attractionStrength * (distance - edge.optimalLength) / edge.optimalLength;
    } else if (distance <= this.config.maxEdgeLength) {
      // Exponential increase in force between optimal and max length
      const normalizedDist = (distance - edge.optimalLength) /
        (this.config.maxEdgeLength - edge.optimalLength);
      force = this.config.attractionStrength *
        (1 - Math.exp(-this.config.forceDecayRate * normalizedDist));
    } else {
      // Strong linear force beyond max length to pull nodes back together
      const baseForce = this.config.attractionStrength *
        (1 - Math.exp(-this.config.forceDecayRate));
      const excess = distance - this.config.maxEdgeLength;
      force = baseForce + this.config.attractionStrength * excess * 0.5;
    }

    return {
      x: (dx / distance) * force,
      y: (dy / distance) * force
    };
  }

  calculateRepulsion(point1, point2) {
    const distance = point1.distanceTo(point2);
    if (Math.abs(distance) < 1e-6) return { x: 0, y: 0 };

    // Base repulsion force
    const force = this.config.repulsionStrength / (distance * distance);

    // Direction vector
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;

    return {
      x: -(dx / distance) * force,
      y: -(dy / distance) * force
    };
  }

  handleCollisions() {
    const nodes = Array.from(this.nodes.values());
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];

        if (node1.collidesWith(node2)) {
          // Calculate separation vector
          const dx = node2.center.x - node1.center.x;
          const dy = node2.center.y - node1.center.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Minimum separation distance
          const minSeparation = (node1.width + node2.width) / 2;

          if (distance < minSeparation) {
            const separationX = (dx / distance) * (minSeparation - distance) / 2;
            const separationY = (dy / distance) * (minSeparation - distance) / 2;

            node1.moveBy(-separationX, -separationY);
            node2.moveBy(separationX, separationY);
          }
        }
      }
    }
  }
}