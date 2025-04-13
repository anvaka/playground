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
  }

  /**
   * Initialize the map with welcome message
   */
  initialize() {
    this.renderer.clear();
    this.renderer.renderWelcomeMessage('Enter a city name to see coffee shop Voronoi diagram');
  }

  /**
   * Set the data for visualization
   * @param {Object} data - Data containing coffee shops, bbox, and city info
   * @param {string} cityName - Name of the city
   */
  setData(data, cityName) {
    this.coffeeShops = data.shops;
    this.bbox = data.bbox;
    this.cityGeojson = data.cityGeojson;
    this.cityName = cityName;
    
    // Create a new transformer for this dataset
    const canvas = this.renderer.canvas;
    this.transformer = new GeoTransformer(this.bbox, canvas.width, canvas.height);
    
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
      .setBoundingBox([0, 0, this.renderer.canvas.width, this.renderer.canvas.height])
      .generate();
    
    // Get Voronoi cells
    const cells = this.voronoiGenerator.getCells();
    
    // First render city outline to establish the boundary
    this.renderer.renderCityOutline(
      this.cityGeojson, 
      (lon, lat) => this.transformer.geoToCanvas(lon, lat)
    );
    
    // Then render Voronoi cells with clipping to the city boundary
    this.renderer.renderVoronoiCellsWithClipping(
      cells,
      this.cityGeojson,
      (lon, lat) => this.transformer.geoToCanvas(lon, lat)
    );
    
    // Optionally, render shop points
    // this.renderer.renderPoints(scaledPoints);
    
    // Render legend with city information
    this.renderer.renderLegend({
      cityName: this.cityName,
      count: this.coffeeShops.length,
      margin: 50
    });
    
    return this;
  }

  /**
   * Prepare city path for clipping by converting GeoJSON to canvas coordinates
   * @param {Object} cityGeojson - GeoJSON representation of city boundaries
   * @returns {Array} Path coordinates for clipping
   */
  prepareCityPathForClipping(cityGeojson) {
    if (!cityGeojson) return null;
    
    const cityPath = [];
    
    // Handle different GeoJSON structure formats
    if (cityGeojson.type === 'Feature' || cityGeojson.type === 'FeatureCollection') {
      // Process features
      const features = cityGeojson.type === 'Feature' ? [cityGeojson] : cityGeojson.features;
      
      features.forEach(feature => {
        if (feature.geometry) {
          this.processGeometry(feature.geometry, cityPath);
        }
      });
    } else if (cityGeojson.type === 'Polygon' || cityGeojson.type === 'MultiPolygon') {
      // Process direct geometry
      this.processGeometry(cityGeojson, cityPath);
    }
    
    return cityPath.length > 0 ? cityPath : null;
  }
  
  /**
   * Process geometry from GeoJSON to extract path coordinates
   * @param {Object} geometry - GeoJSON geometry object
   * @param {Array} cityPath - Output array to store path coordinates
   */
  processGeometry(geometry, cityPath) {
    if (geometry.type === 'Polygon') {
      // Process each ring in the polygon (first ring is outer, rest are holes)
      geometry.coordinates.forEach(ring => {
        const transformedRing = ring.map(coord => {
          return this.transformer.geoToCanvas(coord[0], coord[1]);
        });
        cityPath.push(transformedRing);
      });
    } else if (geometry.type === 'MultiPolygon') {
      // Process each polygon in the multipolygon
      geometry.coordinates.forEach(polygon => {
        polygon.forEach(ring => {
          const transformedRing = ring.map(coord => {
            return this.transformer.geoToCanvas(coord[0], coord[1]);
          });
          cityPath.push(transformedRing);
        });
      });
    }
  }
}