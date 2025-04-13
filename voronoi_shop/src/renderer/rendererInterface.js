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
   * Resize the rendering area
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    throw new Error('Method not implemented');
  }

  /**
   * Set color scheme for the renderer
   * @param {string} scheme - Color scheme name
   */
  setColorScheme(scheme) {
    throw new Error('Method not implemented');
  }

  /**
   * Set background style for the renderer
   * @param {string} style - Background style name
   */
  setBackgroundStyle(style) {
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
   * Render Voronoi cells with clipping to city boundaries
   * @param {Array} cells - Array of Voronoi cells
   * @param {Object} cityGeojson - GeoJSON of city boundaries for clipping
   * @param {Function} transformFn - Function to transform geo coordinates to canvas
   * @param {Array} shops - Optional array of shop data corresponding to cells
   */
  renderVoronoiCellsWithClipping(cells, cityGeojson, transformFn, shops) {
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