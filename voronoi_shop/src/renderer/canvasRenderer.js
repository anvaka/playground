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
    this.backgroundStyle = 'gradient'; // Default background style: 'plain' or 'gradient'
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
   * Set the background style
   * @param {string} style - The background style ('plain' or 'gradient')
   */
  setBackgroundStyle(style) {
    if (['plain', 'gradient'].includes(style)) {
      this.backgroundStyle = style;
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
      const { type, data } = this.currentRenderState;
      
      this.clear();
      if (type === 'voronoi' && data) {
        data.render();
      }
    }
  }

  /**
   * Clear the canvas
   */
  clear() {
    // Default to gradient background for more visual interest
    this.backgroundStyle = this.backgroundStyle || 'gradient';
    
    if (this.backgroundStyle === 'gradient') {
      this.applyGradientBackground();
    } else {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Apply a radial gradient background
   */
  applyGradientBackground() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.max(width, height) * 0.7;
    
    // Create main radial gradient
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, maxRadius
    );
    
    // Add color stops for a more artistic look
    gradient.addColorStop(0, '#f0f4f8');  // Light blue-gray in the center
    gradient.addColorStop(0.5, '#e1e9f0'); // Muted blue-gray
    gradient.addColorStop(0.7, '#d3dfea');  // Slightly darker tone
    gradient.addColorStop(1, '#c4d5e3');   // Darker edge to draw eye inward
    
    // Fill the background with the gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add subtle texture for a rugged look
    this.addBackgroundTexture();
  }
  
  /**
   * Add subtle texture to the background for a rugged artistic look
   */
  addBackgroundTexture() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    ctx.save();
    ctx.globalAlpha = 0.22; // Subtle effect

    // Add radial beams
    // this.drawRadialBeams(ctx, centerX, centerY, width, height);
    
    // Add noise texture overlay
    this.drawNoiseTexture(ctx, width, height);
    
    ctx.restore();
  }

  /**
   * Draw a subtle noise texture across the canvas
   */
  drawNoiseTexture(ctx, width, height) {
    // Create some random dots/noise for texture
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 1.5 + Math.random() * 2.5;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      
      const alpha = 0.05 + Math.random() * 0.05;
      ctx.fillStyle = `rgba(60, 80, 100, ${alpha})`;
      ctx.fill();
    }
  }

  /**
   * Render city outline from GeoJSON
   * @param {Object} cityGeojson - GeoJSON representation of the city
   * @param {Function} transformFn - Function to transform coordinates
   */
  renderCityOutline(cityGeojson, transformFn) {
    if (!cityGeojson) return;
    
    // Make the city outline transparent
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.lineWidth = 1;
    
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
      
      // Calculate distance to edge factor for transparency
      const distanceToEdgeFactor = this.calculateDistanceToEdge(cell, cityPath);
      
      // Fill with a random color with subtle edge transparency
      const baseColor = this.getRandomColor(i);
      const alpha = 0.7 + (distanceToEdgeFactor * 0.3); // Range from 0.7 to 1.0 based on distance
      ctx.fillStyle = this.applyTransparency(baseColor, alpha);
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      
      ctx.restore(); // Restore context after rendering cell (removes clipping)
    });
  }

  /**
   * Calculate a factor representing distance from cell to the edge of the city
   * @param {Object} cell - The Voronoi cell
   * @param {Array} cityPath - City boundary path
   * @returns {number} - Factor between 0 and 1 (0 = edge, 1 = center)
   */
  calculateDistanceToEdge(cell, cityPath) {
    // Simple implementation - this could be improved for accuracy
    // For now, return a random value between 0.5 and 1 for subtle effect
    return 0.5 + Math.random() * 0.5;
  }
  
  /**
   * Apply transparency to a color
   * @param {string} color - CSS color string
   * @param {number} alpha - Alpha value (0-1)
   * @returns {string} - RGBA color string
   */
  applyTransparency(color, alpha) {
    // Simple handling for hex colors
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    // If it's already rgba, replace the alpha
    if (color.startsWith('rgba')) {
      return color.replace(/[\d\.]+\)$/, `${alpha})`);
    }
    
    // If it's rgb, convert to rgba
    if (color.startsWith('rgb')) {
      return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
    }
    
    return color;
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
      
      // Calculate distance to edge for transparency
      const center = this.calculateCellCenter(cell);
      const distanceToEdgeFactor = this.calculateDistanceFromCenter(center, this.canvas.width, this.canvas.height);
      
      // Fill with a random color with subtle edge transparency
      const baseColor = this.getRandomColor(i);
      const alpha = 0.7 + (distanceToEdgeFactor * 0.3); // Range from 0.7 to 1.0 based on distance
      ctx.fillStyle = this.applyTransparency(baseColor, alpha);
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });
    
    // Restore context to remove clipping region
    ctx.restore();
    
    // Remove the green city outline - we don't redraw it
    
    // Store render state
    this.currentRenderState = {
      type: 'voronoi',
      data: {
        render: () => this.renderVoronoiCellsWithClipping(cells, cityGeojson, transformFn)
      }
    };
  }
  
  /**
   * Calculate the center point of a cell
   * @param {Object} cell - Voronoi cell with points
   * @returns {Array} - [x, y] coordinates of center
   */
  calculateCellCenter(cell) {
    if (!cell.points || cell.points.length === 0) return [0, 0];
    
    let sumX = 0;
    let sumY = 0;
    
    for (const point of cell.points) {
      sumX += point[0];
      sumY += point[1];
    }
    
    return [sumX / cell.points.length, sumY / cell.points.length];
  }
  
  /**
   * Calculate a normalized distance from canvas center (for edge transparency)
   * @param {Array} point - [x, y] coordinates
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @returns {number} - Distance factor (0 = edge, 1 = center)
   */
  calculateDistanceFromCenter(point, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    
    const dx = point[0] - centerX;
    const dy = point[1] - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Invert and normalize: 1 at center, 0 at corners
    return Math.max(0, Math.min(1, 1 - (distance / maxDistance)));
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