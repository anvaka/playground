const fs = require('fs').promises;
const Jimp = require('jimp');
const xml2js = require('xml2js');

class HeightmapProcessor {
  constructor() {
    this.heightmapData = null;
    this.heightRange = { min: 0, max: 0 };
    this.svgData = null;
    this.dimensions = { width: 0, height: 0 };
  }

  /**
   * Extract height range from filename
   * Format: filename_-0m-144m.png -> min: 0, max: 144
   */
  parseHeightRange(filename) {
    const match = filename.match(/_(-?\d+)m-(\d+)m\.png$/);
    if (!match) {
      throw new Error('Invalid heightmap filename format. Expected: *_MinmMaxm.png');
    }
    
    return {
      min: parseInt(match[1]),
      max: parseInt(match[2])
    };
  }

  /**
   * Load and process heightmap image
   */
  async loadHeightmap(heightmapPath) {
    console.log(`Loading heightmap: ${heightmapPath}`);
    
    this.heightRange = this.parseHeightRange(heightmapPath);
    console.log(`Height range: ${this.heightRange.min}m to ${this.heightRange.max}m`);
    
    this.heightmapData = await Jimp.read(heightmapPath);
    this.dimensions = {
      width: this.heightmapData.bitmap.width,
      height: this.heightmapData.bitmap.height
    };
    
    console.log(`Heightmap dimensions: ${this.dimensions.width}×${this.dimensions.height}`);
  }

  /**
   * Get height at specific coordinates
   */
  getHeightAtCoordinate(x, y) {
    if (!this.heightmapData) {
      throw new Error('Heightmap not loaded');
    }

    // Clamp coordinates to image bounds
    const clampedX = Math.max(0, Math.min(this.dimensions.width - 1, Math.round(x)));
    const clampedY = Math.max(0, Math.min(this.dimensions.height - 1, Math.round(y)));
    
    // Get grayscale value (assuming heightmap is grayscale)
    const color = this.heightmapData.getPixelColor(clampedX, clampedY);
    const gray = (color >> 16) & 0xFF; // Extract red channel as grayscale
    
    // Convert grayscale (0-255) to height range
    const normalizedHeight = gray / 255;
    const height = this.heightRange.min + (normalizedHeight * (this.heightRange.max - this.heightRange.min));
    
    return height;
  }

  /**
   * Load SVG file
   */
  async loadSvg(svgPath) {
    console.log(`Loading SVG: ${svgPath}`);
    
    const svgContent = await fs.readFile(svgPath, 'utf8');
    const parser = new xml2js.Parser();
    this.svgData = await parser.parseStringPromise(svgContent);
    
    console.log('SVG loaded successfully');
  }

  /**
   * Extract coordinates from SVG path data
   */
  extractPathCoordinates(pathData) {
    const coordinates = [];
    
    // Simple regex to extract coordinate pairs from path data
    // This handles basic Move (M) and Line (L) commands
    const coordRegex = /[ML]\s*([+-]?\d*\.?\d+)\s*([+-]?\d*\.?\d+)/g;
    let match;
    
    while ((match = coordRegex.exec(pathData)) !== null) {
      const x = parseFloat(match[1]);
      const y = parseFloat(match[2]);
      coordinates.push({ x, y });
    }
    
    return coordinates;
  }

  /**
   * Check if path should be colored red based on height threshold
   */
  shouldColorRed(pathData, heightThreshold) {
    const coordinates = this.extractPathCoordinates(pathData);
    
    if (coordinates.length === 0) return false;
    
    // Sample a few points along the path to determine average height
    const samplePoints = Math.min(5, coordinates.length);
    const step = Math.max(1, Math.floor(coordinates.length / samplePoints));
    
    let totalHeight = 0;
    let sampleCount = 0;
    
    for (let i = 0; i < coordinates.length; i += step) {
      const coord = coordinates[i];
      const height = this.getHeightAtCoordinate(coord.x, coord.y);
      totalHeight += height;
      sampleCount++;
    }
    
    const averageHeight = totalHeight / sampleCount;
    return averageHeight < heightThreshold;
  }

  /**
   * Process SVG and create modified version
   */
  async processSvg(heightThreshold, outputPath) {
    if (!this.svgData) {
      throw new Error('SVG not loaded');
    }
    
    console.log(`Processing SVG with height threshold: ${heightThreshold}m`);
    
    let modifiedCount = 0;
    
    // Find and process path elements
    const processElement = (element) => {
      if (element.path && Array.isArray(element.path)) {
        element.path.forEach(path => {
          if (path.$ && path.$.d) {
            const shouldBeRed = this.shouldColorRed(path.$.d, heightThreshold);
            
            if (shouldBeRed) {
              // Set stroke color to red
              path.$.stroke = '#ff0000';
              modifiedCount++;
            }
          }
        });
      }
      
      // Recursively process child elements
      Object.keys(element).forEach(key => {
        if (Array.isArray(element[key])) {
          element[key].forEach(child => {
            if (typeof child === 'object' && child !== null) {
              processElement(child);
            }
          });
        }
      });
    };
    
    processElement(this.svgData.svg);
    
    console.log(`Modified ${modifiedCount} paths to red`);
    
    // Convert back to XML
    const builder = new xml2js.Builder({
      xmldec: { version: '1.0', encoding: 'utf-8' },
      doctype: {
        sysID: 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd',
        pubID: '-//W3C//DTD SVG 1.1//EN'
      }
    });
    
    const modifiedSvg = builder.buildObject(this.svgData);
    
    // Write to output file
    await fs.writeFile(outputPath, modifiedSvg);
    console.log(`Output saved to: ${outputPath}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage: node index.js <heightmap.png> <input.svg> <height_threshold> [output.svg]');
    console.log('Example: node index.js seattle_heightmap_-0m-144m.png Seattle.svg 50 Seattle_processed.svg');
    process.exit(1);
  }
  
  const [heightmapPath, svgPath, heightThreshold, outputPath = 'output.svg'] = args;
  const threshold = parseFloat(heightThreshold);
  
  if (isNaN(threshold)) {
    console.error('Height threshold must be a number');
    process.exit(1);
  }
  
  try {
    const processor = new HeightmapProcessor();
    
    // Load heightmap and SVG
    await processor.loadHeightmap(heightmapPath);
    await processor.loadSvg(svgPath);
    
    // Verify dimensions match
    const svgViewBox = processor.svgData.svg.$.viewBox.split(' ').map(Number);
    const svgWidth = svgViewBox[2];
    const svgHeight = svgViewBox[3];
    
    if (svgWidth !== processor.dimensions.width || svgHeight !== processor.dimensions.height) {
      console.warn(`Warning: SVG viewBox (${svgWidth}×${svgHeight}) doesn't match heightmap dimensions (${processor.dimensions.width}×${processor.dimensions.height})`);
    }
    
    // Process and save
    await processor.processSvg(threshold, outputPath);
    
    console.log('Processing completed successfully!');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = HeightmapProcessor;
