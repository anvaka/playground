import { GeoTransformer } from '../utils/geoTransformer.js';
import { VoronoiGenerator } from './voronoiGenerator.js';

/**
 * Main class to manage Voronoi map visualization
 */
export class VoronoiMap {
  constructor(renderer) {
    this.renderer = renderer;
    this.transformer = null;
    this.voronoiGenerator = new VoronoiGenerator();
    this.coffeeShops = [];
    this.cityName = '';
    this.cityGeojson = null;
    this.bbox = null;
    this.welcomeMessage = document.getElementById('welcome-message');
  }

  /**
   * Initialize the map with welcome message
   */
  initialize() {
    this.renderer.clear();
    this.showWelcomeMessage('Enter a city name to see coffee shop Voronoi diagram');
  }

  /**
   * Shows the welcome message with the specified text
   * @param {string} message - The message to display
   */
  showWelcomeMessage(message) {
    if (this.welcomeMessage) {
      this.welcomeMessage.textContent = message;
      this.welcomeMessage.style.display = 'block';
      this.welcomeMessage.style.opacity = '1';
    }
  }
  
  /**
   * Hides the welcome message
   */
  hideWelcomeMessage() {
    if (this.welcomeMessage) {
      this.welcomeMessage.style.opacity = '0';
      // After transition completes, hide it completely
      setTimeout(() => {
        this.welcomeMessage.style.display = 'none';
      }, 300);
    }
  }
  
  /**
   * Handle resize events by updating the canvas and re-rendering
   * @param {number} width - New width
   * @param {number} height - New height
   */
  handleResize(width, height) {
    this.renderer.resize(width, height);
    
    // Re-render if we have data
    if (this.bbox && this.coffeeShops.length > 0) {
      this.transformer = new GeoTransformer(this.bbox, width, height);
      this.render();
    }
  }

  /**
   * Set the data for visualization
   * @param {Object} data - Data containing coffee shops, bbox, and city info
   * @param {string} cityName - Name of the city
   */
  setData(data, cityName) {
    this.hideWelcomeMessage();
    
    this.coffeeShops = data.shops;
    this.bbox = data.bbox;
    this.cityGeojson = data.cityGeojson;
    this.cityName = cityName;
    
    // Create a new transformer for this dataset
    this.transformer = new GeoTransformer(
      this.bbox, 
      window.innerWidth, 
      window.innerHeight
    );
    
    return this;
  }

  /**
   * Render the Voronoi map with all elements
   */
  render() {
    if (!this.coffeeShops.length || !this.transformer) {
      throw new Error('Data must be set before rendering');
    }

    // Clear the canvas
    this.renderer.clear();
    
    // Transform geo coordinates to canvas coordinates
    const scaledPoints = this.coffeeShops.map(shop => {
      return this.transformer.geoToCanvas(shop.lon, shop.lat);
    });
    
    // Set up and generate Voronoi diagram
    this.voronoiGenerator
      .setPoints(scaledPoints)
      .setBoundingBox([0, 0, window.innerWidth, window.innerHeight])
      .generate();
    
    const cells = this.voronoiGenerator.getCells();
    
    // Render city outline and Voronoi cells with clipping
    this.renderer.renderCityOutline(
      this.cityGeojson, 
      (lon, lat) => this.transformer.geoToCanvas(lon, lat)
    );
    
    this.renderer.renderVoronoiCellsWithClipping(
      cells,
      this.cityGeojson,
      (lon, lat) => this.transformer.geoToCanvas(lon, lat),
      this.coffeeShops
    );
    
    return this;
  }
}