import { RendererInterface } from './rendererInterface.js';

/**
 * Canvas implementation of the renderer interface
 */
export class CanvasRenderer extends RendererInterface {
  constructor(canvas) {
    super(canvas);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.colorScheme = 'muted'; // Default color scheme
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
          this.drawGeometry(feature.geometry, transformFn);
        }
      });
    } else if (cityGeojson.type === 'Feature') {
      // Process single feature
      if (cityGeojson.geometry) {
        this.drawGeometry(cityGeojson.geometry, transformFn);
      }
    } else {
      // Direct geometry object
      this.drawGeometry(cityGeojson, transformFn);
    }
  }
  
  /**
   * Draw geometry from GeoJSON
   * @param {Object} geometry - GeoJSON geometry object
   * @param {Function} transformFn - Function to transform coordinates
   */
  drawGeometry(geometry, transformFn) {
    this.ctx.beginPath();
    
    if (geometry.type === 'Polygon') {
      // Draw the outer ring of the polygon
      this.drawRing(geometry.coordinates[0], transformFn);
      
      // Draw any holes (inner rings)
      for (let i = 1; i < geometry.coordinates.length; i++) {
        this.drawRing(geometry.coordinates[i], transformFn);
      }
    } else if (geometry.type === 'MultiPolygon') {
      // Draw each polygon in the multipolygon
      geometry.coordinates.forEach(polygon => {
        // Draw the outer ring
        this.drawRing(polygon[0], transformFn);
        
        // Draw any holes
        for (let i = 1; i < polygon.length; i++) {
          this.drawRing(polygon[i], transformFn);
        }
      });
    } else if (geometry.type === 'Point') {
      const point = transformFn(geometry.coordinates[0], geometry.coordinates[1]);
      this.ctx.arc(point[0], point[1], 10, 0, Math.PI * 2);
    }
    
    this.ctx.stroke();
  }
  
  /**
   * Draw a ring (polygon boundary or hole)
   * @param {Array} ring - Array of coordinates for the ring
   * @param {Function} transformFn - Function to transform coordinates
   */
  drawRing(ring, transformFn) {
    if (!ring || ring.length === 0) return;
    
    const start = transformFn(ring[0][0], ring[0][1]);
    this.ctx.moveTo(start[0], start[1]);
    
    for (let i = 1; i < ring.length; i++) {
      const point = transformFn(ring[i][0], ring[i][1]);
      this.ctx.lineTo(point[0], point[1]);
    }
    
    this.ctx.closePath();
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
    this.createClipPathFromGeoJSON(cityGeojson, transformFn);
    
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
    this.createClipPathFromGeoJSON(cityGeojson, transformFn);
    ctx.stroke();
  }
  
  /**
   * Create a clip path from GeoJSON data
   * @param {Object} geoJson - The GeoJSON data
   * @param {Function} transformFn - Function to transform geo coordinates
   */
  createClipPathFromGeoJSON(geoJson, transformFn) {
    if (!geoJson) return;
    
    // Handle different GeoJSON formats
    if (geoJson.type === 'FeatureCollection') {
      geoJson.features.forEach(feature => {
        if (feature.geometry) {
          this.addGeometryToPath(feature.geometry, transformFn);
        }
      });
    } else if (geoJson.type === 'Feature') {
      if (geoJson.geometry) {
        this.addGeometryToPath(geoJson.geometry, transformFn);
      }
    } else {
      // Direct geometry object
      this.addGeometryToPath(geoJson, transformFn);
    }
  }
  
  /**
   * Add geometry to the current path
   * @param {Object} geometry - GeoJSON geometry object
   * @param {Function} transformFn - Function to transform coordinates
   */
  addGeometryToPath(geometry, transformFn) {
    if (geometry.type === 'Polygon') {
      // Add the outer ring to the path
      this.addRingToPath(geometry.coordinates[0], transformFn);
      
      // Add holes (inner rings) in reverse order to create proper mask
      for (let i = 1; i < geometry.coordinates.length; i++) {
        this.addRingToPath(geometry.coordinates[i], transformFn, true);
      }
    } else if (geometry.type === 'MultiPolygon') {
      // Process each polygon in the multipolygon
      geometry.coordinates.forEach(polygon => {
        // Add outer ring
        this.addRingToPath(polygon[0], transformFn);
        
        // Add holes
        for (let i = 1; i < polygon.length; i++) {
          this.addRingToPath(polygon[i], transformFn, true);
        }
      });
    }
  }
  
  /**
   * Add a ring to the current path
   * @param {Array} ring - Array of coordinates for the ring
   * @param {Function} transformFn - Function to transform coordinates
   * @param {boolean} isHole - Whether this ring is a hole (inner ring)
   */
  addRingToPath(ring, transformFn, isHole = false) {
    if (!ring || ring.length === 0) return;
    
    // For holes, we need to go in the opposite direction
    const orderedRing = isHole ? [...ring].reverse() : ring;
    
    const start = transformFn(orderedRing[0][0], orderedRing[0][1]);
    this.ctx.moveTo(start[0], start[1]);
    
    for (let i = 1; i < orderedRing.length; i++) {
      const point = transformFn(orderedRing[i][0], orderedRing[i][1]);
      this.ctx.lineTo(point[0], point[1]);
    }
    
    this.ctx.closePath();
  }
  
  /**
   * Fill with a color from the selected palette
   * @param {number} index - The index to generate a color from
   * @returns {string} - A CSS color string
   */
  getColorFromPalette(index) {
    const palettes = {
      // Muted earth tones for a cozy vibe
      muted: [
        '#d9c5a0', // beige
        '#8a9a5b', // sage green
        '#c19a6b', // light brown
        '#a4b494', // grayed green  
        '#7d6c46', // dark olive
        '#b5b8a3', // pale sage
        '#a98467', // medium brown
        '#718355', // forest green
        '#d8d4c4', // light beige
        '#84714f'  // dark tan
      ],
      
      // Sunset gradient colors for warmth
      sunset: [
        '#f9a03f', // orange
        '#e06377', // coral
        '#c83349', // red
        '#5c374c', // deep purple
        '#eb5e55', // salmon
        '#ff9e80', // peach
        '#d35269', // raspberry
        '#8a5082', // violet
        '#edad92', // light peach
        '#aa3e98'  // magenta
      ],
      
      // Monochromatic blues with contrast
      blues: [
        '#a4c3d2', // light blue
        '#7a9eb1', // medium blue
        '#5c7d99', // blue grey
        '#426a8c', // slate blue
        '#375673', // dark blue
        '#2a4158', // navy
        '#8fb5d5', // sky blue
        '#6a93ad', // steel blue
        '#b8d0e0', // pale blue  
        '#1e3648'  // dark navy
      ]
    };
    
    const palette = palettes[this.colorScheme];
    return palette[index % palette.length];
  }

  /**
   * Generate a consistent color based on an index
   * @param {number} index - The index to generate a color from
   * @returns {string} - A CSS color string
   */
  getRandomColor(index) {
    return this.getColorFromPalette(index);
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

  /**
   * Render a legend
   * @param {Object} options - Legend options including city name and count
   */
  renderLegend(options) {
    const { cityName, count, margin = 50 } = options;
    
    this.ctx.fillStyle = '#000000';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Coffee Shops in ${cityName}: ${count}`, margin, 30);
    
    // Draw red dot for legend
    this.ctx.fillStyle = '#FF0000';
    this.ctx.beginPath();
    this.ctx.arc(margin + 200, 26, 3, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw legend text for coffee shop points
    this.ctx.fillStyle = '#000000';
    this.ctx.fillText('Coffee Shop', margin + 210, 30);
    
    // Add city outline to legend
    this.ctx.strokeStyle = '#006600';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(margin + 280, 26);
    this.ctx.lineTo(margin + 320, 26);
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#000000';
    this.ctx.fillText('City Outline', margin + 330, 30);
  }
}