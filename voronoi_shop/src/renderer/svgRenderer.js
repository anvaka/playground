// filepath: /Users/anvaka/projects/playground/voronoi_shop/src/renderer/svgRenderer.js
import { RendererInterface } from './rendererInterface.js';
import { getColorFromPalette } from '../utils/colorPalettes.js';

/**
 * SVG implementation of the renderer interface
 */
export class SVGRenderer extends RendererInterface {
  constructor(container) {
    super(container);
    
    // Create SVG element if not already an SVG
    if (container.tagName.toLowerCase() !== 'svg') {
      this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      container.appendChild(this.svg);
    } else {
      this.svg = container;
    }
    
    // Set initial dimensions
    this.svg.setAttribute('width', container.offsetWidth || window.innerWidth);
    this.svg.setAttribute('height', container.offsetHeight || window.innerHeight);
    
    // Create background and content groups
    this.backgroundGroup = this._createGroup('background-layer');
    this.contentGroup = this._createGroup('content-layer');
    this.pointsGroup = this._createGroup('points-layer');
    
    // Store state
    this.colorScheme = 'muted'; // Default color scheme
    this.backgroundStyle = 'gradient'; // Default background style: 'plain' or 'gradient'
    this.currentRenderState = null; // Store current render state for resize handling
    
    // Setup tooltip element
    this._setupTooltip();
    
    if (typeof panzoom !== 'undefined') {
      this.panzoom = panzoom(this.contentGroup);
    }
  }

  /**
   * Setup tooltip element for displaying shop information
   */
  _setupTooltip() {
    // Create tooltip element if it doesn't exist
    let tooltip = document.getElementById('voronoi-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'voronoi-tooltip';
      document.body.appendChild(tooltip);
    }
    this.tooltip = tooltip;
    
    // Add mouse move listener to track mouse position for tooltip
    document.addEventListener('mousemove', (e) => {
      this.tooltip.style.left = (e.pageX + 10) + 'px';
      this.tooltip.style.top = (e.pageY + 10) + 'px';
    });
  }

  /**
   * Helper method to create SVG group elements
   * @param {string} id - Group ID
   * @returns {SVGGElement} - The created group
   */
  _createGroup(id) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('id', id);
    this.svg.appendChild(group);
    return group;
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
   * Resize the SVG to match new dimensions
   * @param {number} width - New canvas width
   * @param {number} height - New canvas height
   */
  resize(width, height) {
    this.svg.setAttribute('width', width);
    this.svg.setAttribute('height', height);
    
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
   * Clear the SVG
   */
  clear() {
    // Remove all elements from the groups
    while (this.backgroundGroup.firstChild) {
      this.backgroundGroup.removeChild(this.backgroundGroup.firstChild);
    }
    
    while (this.contentGroup.firstChild) {
      this.contentGroup.removeChild(this.contentGroup.firstChild);
    }
    
    while (this.pointsGroup.firstChild) {
      this.pointsGroup.removeChild(this.pointsGroup.firstChild);
    }
    
    // Apply background
    if (this.backgroundStyle === 'gradient') {
      this.applyGradientBackground();
    } else {
      this.applyPlainBackground();
    }
  }

  /**
   * Apply a plain background
   */
  applyPlainBackground() {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', 0);
    rect.setAttribute('y', 0);
    rect.setAttribute('width', this.svg.getAttribute('width'));
    rect.setAttribute('height', this.svg.getAttribute('height'));
    rect.setAttribute('fill', '#ffffff');
    this.backgroundGroup.appendChild(rect);
  }

  /**
   * Apply a radial gradient background
   */
  applyGradientBackground() {
    const width = parseInt(this.svg.getAttribute('width'));
    const height = parseInt(this.svg.getAttribute('height'));
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.max(width, height) * 0.7;
    
    // Create gradient definition
    const gradientId = 'radialGradient-' + Math.random().toString(36).substring(2, 9);
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    
    gradient.setAttribute('id', gradientId);
    gradient.setAttribute('cx', centerX);
    gradient.setAttribute('cy', centerY);
    gradient.setAttribute('r', maxRadius);
    gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
    
    // Add color stops for a more artistic look
    const stops = [
      { offset: '0%', color: '#f0f4f8' },   // Light blue-gray in the center
      { offset: '50%', color: '#e1e9f0' },  // Muted blue-gray
      { offset: '70%', color: '#d3dfea' },  // Slightly darker tone
      { offset: '100%', color: '#c4d5e3' }  // Darker edge to draw eye inward
    ];
    
    stops.forEach(s => {
      const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop.setAttribute('offset', s.offset);
      stop.setAttribute('stop-color', s.color);
      gradient.appendChild(stop);
    });
    
    defs.appendChild(gradient);
    this.backgroundGroup.appendChild(defs);
    
    // Create and add background rectangle with gradient
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', 0);
    rect.setAttribute('y', 0);
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
    rect.setAttribute('fill', `url(#${gradientId})`);
    this.backgroundGroup.appendChild(rect);
    
    // Add texture
    this.addBackgroundTexture();
  }

  /**
   * Add subtle texture to the background for a rugged artistic look
   */
  addBackgroundTexture() {
    const width = parseInt(this.svg.getAttribute('width'));
    const height = parseInt(this.svg.getAttribute('height'));
    
    // Add noise texture overlay
    this.drawNoiseTexture(width, height);
  }

  /**
   * Draw a subtle noise texture across the SVG
   */
  drawNoiseTexture(width, height) {
    const noiseGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    noiseGroup.setAttribute('opacity', '0.22');
    
    // Create some random dots/noise for texture
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 1.5 + Math.random() * 2.5;
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', size);
      
      const alpha = 0.05 + Math.random() * 0.05;
      circle.setAttribute('fill', `rgba(60, 80, 100, ${alpha})`);
      
      noiseGroup.appendChild(circle);
    }
    
    this.backgroundGroup.appendChild(noiseGroup);
  }

  /**
   * Render city outline from GeoJSON
   * @param {Object} cityGeojson - GeoJSON representation of the city
   * @param {Function} transformFn - Function to transform coordinates
   */
  renderCityOutline(cityGeojson, transformFn) {
    if (!cityGeojson) return;
    
    const cityGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    cityGroup.setAttribute('class', 'city-outline');
    
    // Handle GeoJSON based on type
    if (cityGeojson.type === 'FeatureCollection') {
      // Process each feature in the collection
      cityGeojson.features.forEach(feature => {
        if (feature.geometry) {
          this._addGeometryToGroup(cityGroup, feature.geometry, transformFn);
        }
      });
    } else if (cityGeojson.type === 'Feature') {
      // Process single feature
      if (cityGeojson.geometry) {
        this._addGeometryToGroup(cityGroup, cityGeojson.geometry, transformFn);
      }
    } else {
      // Direct geometry object
      this._addGeometryToGroup(cityGroup, cityGeojson, transformFn);
    }
    
    this.contentGroup.appendChild(cityGroup);
  }

  /**
   * Helper method to add geometry to an SVG group
   * @param {SVGGElement} group - SVG group to add to
   * @param {Object} geometry - GeoJSON geometry object
   * @param {Function} transformFn - Function to transform coordinates
   */
  _addGeometryToGroup(group, geometry, transformFn) {
    if (geometry.type === 'Polygon') {
      const path = this._createPathFromPolygon(geometry.coordinates, transformFn);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'rgba(0, 0, 0, 0.1)');
      path.setAttribute('stroke-width', '1');
      group.appendChild(path);
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach(polygonCoords => {
        const path = this._createPathFromPolygon(polygonCoords, transformFn);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'rgba(0, 0, 0, 0.1)');
        path.setAttribute('stroke-width', '1');
        group.appendChild(path);
      });
    }
  }

  /**
   * Helper method to create SVG path from polygon coordinates
   * @param {Array} coordinates - Polygon coordinates
   * @param {Function} transformFn - Function to transform coordinates
   * @returns {SVGPathElement} - The created path
   */
  _createPathFromPolygon(coordinates, transformFn) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let pathData = '';
    
    // Process outer ring
    if (coordinates[0] && coordinates[0].length) {
      const first = transformFn(coordinates[0][0][0], coordinates[0][0][1]);
      pathData += `M ${first[0]} ${first[1]} `;
      
      for (let i = 1; i < coordinates[0].length; i++) {
        const point = transformFn(coordinates[0][i][0], coordinates[0][i][1]);
        pathData += `L ${point[0]} ${point[1]} `;
      }
      
      pathData += 'Z '; // Close the outer ring
    }
    
    // Process inner rings (holes)
    for (let ring = 1; ring < coordinates.length; ring++) {
      if (coordinates[ring] && coordinates[ring].length) {
        const first = transformFn(coordinates[ring][0][0], coordinates[ring][0][1]);
        pathData += `M ${first[0]} ${first[1]} `;
        
        for (let i = 1; i < coordinates[ring].length; i++) {
          const point = transformFn(coordinates[ring][i][0], coordinates[ring][i][1]);
          pathData += `L ${point[0]} ${point[1]} `;
        }
        
        pathData += 'Z '; // Close the inner ring
      }
    }
    
    path.setAttribute('d', pathData);
    return path;
  }

  /**
   * Helper method to create a path from a cell points array
   * @param {Array} points - Array of [x, y] points
   * @returns {string} - SVG path data string
   */
  _createPathDataFromPoints(points) {
    if (!points || points.length < 3) return '';
    
    let pathData = `M ${points[0][0]} ${points[0][1]} `;
    for (let i = 1; i < points.length; i++) {
      pathData += `L ${points[i][0]} ${points[i][1]} `;
    }
    pathData += 'Z';
    
    return pathData;
  }

  /**
   * Render Voronoi cells with clipping to city boundaries
   * @param {Array} cells - Array of Voronoi cells
   * @param {Object} cityGeojson - GeoJSON of city boundaries for clipping
   * @param {Function} transformFn - Function to transform geo coordinates to canvas
   * @param {Array} shops - Optional array of shop data corresponding to cells
   */
  renderVoronoiCellsWithClipping(cells, cityGeojson, transformFn, shops = []) {
    if (!cells || !cells.length) return;
    
    // Create a clip path for the city boundary
    const clipId = 'city-clip-' + Math.random().toString(36).substring(2, 9);
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.setAttribute('id', clipId);
    
    this._addCityBoundaryClipPath(clipPath, cityGeojson, transformFn);
    defs.appendChild(clipPath);
    this.contentGroup.appendChild(defs);
    
    // Create a group for all cells with the clip path applied
    const cellsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    cellsGroup.setAttribute('clip-path', `url(#${clipId})`);
    
    // Create and add each cell
    cells.forEach((cell, i) => {
      if (!cell || !cell.points || cell.points.length < 3) return;
      
      const center = this.calculateCellCenter(cell);
      const width = parseInt(this.svg.getAttribute('width'));
      const height = parseInt(this.svg.getAttribute('height'));
      const distanceToEdgeFactor = this.calculateDistanceFromCenter(center, width, height);
      
      // Create path for the cell
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', this._createPathDataFromPoints(cell.points));
      
      // Fill with color from palette
      const baseColor = this.getRandomColor(i);
      const alpha = 0.7 + (distanceToEdgeFactor * 0.3);
      path.setAttribute('fill', this.applyTransparency(baseColor, alpha));
      
      // Add border
      path.setAttribute('stroke', '#333');
      path.setAttribute('stroke-width', '0.5');
      
      // Add shop data as attributes if available
      if (shops[cell.index]) {
        const shop = shops[cell.index];
        const shopName = shop.tags?.name || 'Coffee Shop';
        const address = shop.tags?.['addr:street'] || '';
        
        path.setAttribute('data-shop-name', shopName);
        if (address) {
          path.setAttribute('data-shop-address', address);
        }
        
        // Add event listeners for tooltip
        path.addEventListener('mouseenter', () => {
          let tooltipContent = shopName;
          if (address) {
            tooltipContent += `<br>${address}`;
          }
          
          this.tooltip.innerHTML = tooltipContent;
          this.tooltip.style.opacity = '1';
        });
        
        path.addEventListener('mouseleave', () => {
          this.tooltip.style.opacity = '0';
        });
      }
      
      cellsGroup.appendChild(path);
    });
    
    this.contentGroup.appendChild(cellsGroup);
    
    // Store render state
    this.currentRenderState = {
      type: 'voronoi',
      data: {
        render: () => this.renderVoronoiCellsWithClipping(cells, cityGeojson, transformFn, shops)
      }
    };
  }

  /**
   * Helper method to add city boundary as a clip path
   * @param {SVGClipPathElement} clipPath - SVG clip path element
   * @param {Object} cityGeojson - GeoJSON of city boundaries
   * @param {Function} transformFn - Function to transform coordinates
   */
  _addCityBoundaryClipPath(clipPath, cityGeojson, transformFn) {
    if (!cityGeojson) return;
    
    // Handle different GeoJSON formats
    if (cityGeojson.type === 'FeatureCollection') {
      cityGeojson.features.forEach(feature => {
        if (feature.geometry) {
          this._addGeometryToClipPath(clipPath, feature.geometry, transformFn);
        }
      });
    } else if (cityGeojson.type === 'Feature') {
      if (cityGeojson.geometry) {
        this._addGeometryToClipPath(clipPath, cityGeojson.geometry, transformFn);
      }
    } else {
      // Direct geometry object
      this._addGeometryToClipPath(clipPath, cityGeojson, transformFn);
    }
  }

  /**
   * Helper method to add geometry to a clip path
   * @param {SVGClipPathElement} clipPath - SVG clip path element
   * @param {Object} geometry - GeoJSON geometry object
   * @param {Function} transformFn - Function to transform coordinates
   */
  _addGeometryToClipPath(clipPath, geometry, transformFn) {
    if (geometry.type === 'Polygon') {
      const path = this._createPathFromPolygon(geometry.coordinates, transformFn);
      path.setAttribute('fill', 'black');
      clipPath.appendChild(path);
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach(polygonCoords => {
        const path = this._createPathFromPolygon(polygonCoords, transformFn);
        path.setAttribute('fill', 'black');
        clipPath.appendChild(path);
      });
    }
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
   * @param {number} width - SVG width
   * @param {number} height - SVG height
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
    points.forEach(point => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', point[0]);
      circle.setAttribute('cy', point[1]);
      circle.setAttribute('r', '3');
      circle.setAttribute('fill', '#FF0000');
      this.pointsGroup.appendChild(circle);
    });
  }

  /**
   * Simple implementation for backward compatibility - just calls renderVoronoiCellsWithClipping
   * @param {Array} cells - Array of Voronoi cells
   * @param {Array} cityPath - Optional city boundary path for clipping
   */
  renderVoronoiCells(cells, cityPath = null) {
    // This is mainly for interface compatibility
    // In a real implementation, you'd want to handle the cityPath appropriately
    console.warn('SVGRenderer.renderVoronoiCells called - for full functionality use renderVoronoiCellsWithClipping');
    
    if (!cells || !cells.length) return;
    
    // Create a group for all cells
    const cellsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // Create and add each cell
    cells.forEach((cell, i) => {
      if (!cell || !cell.points || cell.points.length < 3) return;
      
      const center = this.calculateCellCenter(cell);
      const width = parseInt(this.svg.getAttribute('width'));
      const height = parseInt(this.svg.getAttribute('height'));
      const distanceToEdgeFactor = this.calculateDistanceFromCenter(center, width, height);
      
      // Create path for the cell
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', this._createPathDataFromPoints(cell.points));
      
      // Fill with color from palette
      const baseColor = this.getRandomColor(i);
      const alpha = 0.7 + (distanceToEdgeFactor * 0.3);
      path.setAttribute('fill', this.applyTransparency(baseColor, alpha));
      
      // Add border
      path.setAttribute('stroke', '#333');
      path.setAttribute('stroke-width', '0.5');
      
      cellsGroup.appendChild(path);
    });
    
    this.contentGroup.appendChild(cellsGroup);
  }
}