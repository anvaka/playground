/**
 * Generates a Voronoi diagram from a set of points using D3's Delaunay
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
   * @returns {VoronoiGenerator} - This instance for method chaining
   */
  setPoints(points) {
    this.points = points;
    return this;
  }

  /**
   * Set the bounding box for the Voronoi diagram
   * @param {Array} bbox - [x0, y0, x1, y1] bounding box
   * @returns {VoronoiGenerator} - This instance for method chaining
   */
  setBoundingBox(bbox) {
    this.bbox = bbox;
    return this;
  }

  /**
   * Generate the Voronoi diagram using D3's Delaunay
   * @returns {VoronoiGenerator} - This instance for method chaining
   * @throws {Error} If points or bounding box are not set
   */
  generate() {
    if (!this.points.length || !this.bbox) {
      throw new Error('Points and bounding box must be set before generating the Voronoi diagram');
    }

    const delaunay = d3.Delaunay.from(this.points);
    const voronoi = delaunay.voronoi(this.bbox);
    
    // Process cells from the voronoi diagram
    this.cells = Array.from({length: this.points.length}, (_, i) => {
      const cell = voronoi.cellPolygon(i);
      return cell ? { points: cell, index: i } : null;
    }).filter(Boolean);

    return this;
  }

  /**
   * Get the generated cells
   * @returns {Array} Array of cell objects with points and index properties
   */
  getCells() {
    return this.cells;
  }
}