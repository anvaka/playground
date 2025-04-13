import { RendererInterface } from './rendererInterface.js';
import { getColorFromPalette } from '../utils/colorPalettes.js';
import { createClipPathFromGeoJSON, drawGeometry } from '../utils/geoJsonPathUtils.js';

/**
 * Canvas implementation of the renderer interface
 */
export class CanvasRenderer extends RendererInterface {
  constructor(canvas) {
    super(canvas);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.colorScheme = 'muted'; // Default color scheme
    this.currentRenderState = null; // Store current render state for resize handling
  }

  /**
   * Set the color scheme to use for cell rendering
   * @param {string} scheme - The color scheme to use ('muted', 'sunset', or 'blues')
   */
  setColorScheme(scheme) {
    if (['muted', 'sunset', 'blues'].includes(scheme)) {
      this.colorScheme = scheme;
    }
  }
  
  /**
   * Resize the canvas to match new dimensions
   * @param {number} width - New canvas width
   * @param {number} height - New canvas height
   */
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Re-render current content if available
    if (this.currentRenderState) {
      const { type, message, data } = this.currentRenderState;
      
      if (type === 'welcome') {
        this.renderWelcomeMessage(message);
      } else if (type === 'voronoi' && data) {
        this.clear();
        data.render();
      }
    }
  }

  /**
   * Clear the canvas
   */
  clear() {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Render welcome message
   * @param {string} message - The message to display
   */
  renderWelcomeMessage(message) {
    this.ctx.fillStyle = '#333333';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(message, this.canvas.width/2, this.canvas.height/2);
    
    // Store render state
    this.currentRenderState = {
      type: 'welcome',
      message: message
    };
  }

  /**
   * Render city outline from GeoJSON
   * @param {Object} cityGeojson - GeoJSON representation of the city
   * @param {Function} transformFn - Function to transform coordinates
   */
  renderCityOutline(cityGeojson, transformFn) {
    if (!cityGeojson) return;
    
    this.ctx.strokeStyle = '#006600';
    this.ctx.lineWidth = 2;
    
    // Handle GeoJSON based on type
    if (cityGeojson.type === 'FeatureCollection') {
      // Process each feature in the collection
      cityGeojson.features.forEach(feature => {
        if (feature.geometry) {
          drawGeometry(this.ctx, feature.geometry, transformFn);
        }
      });
    } else if (cityGeojson.type === 'Feature') {
      // Process single feature
      if (cityGeojson.geometry) {
        drawGeometry(this.ctx, cityGeojson.geometry, transformFn);
      }
    } else {
      // Direct geometry object
      drawGeometry(this.ctx, cityGeojson, transformFn);
    }
  }

  /**
   * Render Voronoi cells with clipping to city boundaries
   * @param {Array} cells - Array of Voronoi cells
   * @param {Array} cityPath - Optional city boundary path for clipping
   */
  renderVoronoiCells(cells, cityPath = null) {
    const ctx = this.ctx;
    
    // Draw each cell
    cells.forEach((cell, i) => {
      if (!cell || !cell.points || cell.points.length < 3) return;
      
      ctx.save(); // Save context before clipping
      
      // If we have a cityPath, create a clipping path
      if (cityPath && cityPath.length) {
        ctx.beginPath();
        
        // Add each polygon from the city path to our clipping path
        cityPath.forEach(polygon => {
          if (polygon && polygon.length) {
            // Move to first point
            ctx.moveTo(polygon[0][0], polygon[0][1]);
            
            // Add lines to remaining points
            for (let i = 1; i < polygon.length; i++) {
              ctx.lineTo(polygon[i][0], polygon[i][1]);
            }
            
            // Close the path
            ctx.closePath();
          }
        });
        
        // Set the clipping region
        ctx.clip();
      }
      
      // Draw the cell
      ctx.beginPath();
      ctx.moveTo(cell.points[0][0], cell.points[0][1]);
      
      for (let j = 1; j < cell.points.length; j++) {
        ctx.lineTo(cell.points[j][0], cell.points[j][1]);
      }
      
      ctx.closePath();
      
      // Fill with a random color
      const color = this.getRandomColor(i);
      ctx.fillStyle = color;
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      
      ctx.restore(); // Restore context after rendering cell (removes clipping)
    });
  }

  /**
   * Render Voronoi cells with clipping to city boundaries
   * @param {Array} cells - Array of Voronoi cells
   * @param {Object} cityGeojson - GeoJSON of city boundaries for clipping
   * @param {Function} transformFn - Function to transform geo coordinates to canvas
   */
  renderVoronoiCellsWithClipping(cells, cityGeojson, transformFn) {
    if (!cells || !cells.length) return;
    
    const ctx = this.ctx;
    
    // Create a clipping region from the city boundary
    ctx.save();
    
    ctx.beginPath();
    createClipPathFromGeoJSON(ctx, cityGeojson, transformFn);
    
    // Apply the clipping region
    ctx.clip();
    
    // Now draw all cells - they'll be clipped to the city boundary
    cells.forEach((cell, i) => {
      if (!cell || !cell.points || cell.points.length < 3) return;
      
      ctx.beginPath();
      ctx.moveTo(cell.points[0][0], cell.points[0][1]);
      
      for (let j = 1; j < cell.points.length; j++) {
        ctx.lineTo(cell.points[j][0], cell.points[j][1]);
      }
      
      ctx.closePath();
      
      // Fill with a random color
      const color = this.getRandomColor(i);
      ctx.fillStyle = color;
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });
    
    // Restore context to remove clipping region
    ctx.restore();
    
    // Re-draw the city outline on top
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#006600';
    ctx.beginPath();
    createClipPathFromGeoJSON(ctx, cityGeojson, transformFn);
    ctx.stroke();
    
    // Store render state
    this.currentRenderState = {
      type: 'voronoi',
      data: {
        render: () => this.renderVoronoiCellsWithClipping(cells, cityGeojson, transformFn)
      }
    };
  }
  
  /**
   * Generate a consistent color based on an index
   * @param {number} index - The index to generate a color from
   * @returns {string} - A CSS color string
   */
  getRandomColor(index) {
    return getColorFromPalette(this.colorScheme, index);
  }

  /**
   * Render points at specific locations
   * @param {Array} points - Array of [x, y] coordinates
   */
  renderPoints(points) {
    this.ctx.fillStyle = '#FF0000';
    points.forEach(point => {
      this.ctx.beginPath();
      this.ctx.arc(point[0], point[1], 3, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
}