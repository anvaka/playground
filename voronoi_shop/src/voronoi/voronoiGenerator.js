/**
 * Generates a Voronoi diagram from a set of points
 */
export class VoronoiGenerator {
  constructor() {
    this.points = [];
    this.cells = [];
    this.bbox = null;
  }

  /**
   * Set points for the Voronoi diagram
   * @param {Array} points - Array of [x, y] coordinates
   */
  setPoints(points) {
    this.points = points;
    return this;
  }

  /**
   * Set the bounding box for the Voronoi diagram
   * @param {Array} bbox - [x0, y0, x1, y1] bounding box
   */
  setBoundingBox(bbox) {
    this.bbox = bbox;
    return this;
  }

  /**
   * Generate the Voronoi diagram using D3's Delaunay
   */
  generate() {
    if (!this.points.length || !this.bbox) {
      throw new Error('Points and bounding box must be set before generating the Voronoi diagram');
    }

    const delaunay = d3.Delaunay.from(this.points);
    const voronoi = delaunay.voronoi(this.bbox);
    
    // Store cells for easy access
    this.cells = [];
    for (let i = 0; i < this.points.length; i++) {
      const cell = voronoi.cellPolygon(i);
      if (cell) {
        this.cells.push({
          points: cell,
          index: i
        });
      }
    }

    return this;
  }

  /**
   * Get the generated cells
   * @returns {Array} Array of cell objects
   */
  getCells() {
    return this.cells;
  }
}