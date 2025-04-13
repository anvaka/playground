/**
 * Interface for renderers
 * This provides a common interface that different renderers can implement
 * (Canvas, SVG, WebGL, etc.)
 */
export class RendererInterface {
  constructor(container) {
    this.container = container;
  }

  /**
   * Clear the rendering area
   */
  clear() {
    throw new Error('Method not implemented');
  }

  /**
   * Render welcome message
   * @param {string} message - The message to display
   */
  renderWelcomeMessage(message) {
    throw new Error('Method not implemented');
  }

  /**
   * Render city outline from GeoJSON
   * @param {Object} cityGeojson - GeoJSON representation of the city
   * @param {Function} transformFn - Function to transform coordinates
   */
  renderCityOutline(cityGeojson, transformFn) {
    throw new Error('Method not implemented');
  }

  /**
   * Render Voronoi cells
   * @param {Array} cells - Array of cell objects with points and index properties
   */
  renderVoronoiCells(cells) {
    throw new Error('Method not implemented');
  }

  /**
   * Render points at specific locations
   * @param {Array} points - Array of [x, y] coordinates
   */
  renderPoints(points) {
    throw new Error('Method not implemented');
  }
}