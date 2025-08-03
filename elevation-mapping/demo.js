#!/usr/bin/env node

const HeightmapProcessor = require('./index.js');

/**
 * Demo script showing different height thresholds
 */
async function runDemo() {
  const heightmapPath = 'seattle_heightmap_-0m-144m.png';
  const svgPath = 'Seattle.svg';
  
  const thresholds = [25, 50, 75, 100];
  
  console.log('Running elevation processing demo...\n');
  
  for (const threshold of thresholds) {
    const outputPath = `Seattle_${threshold}m.svg`;
    
    console.log(`Processing with ${threshold}m threshold...`);
    
    try {
      const processor = new HeightmapProcessor();
      await processor.loadHeightmap(heightmapPath);
      await processor.loadSvg(svgPath);
      await processor.processSvg(threshold, outputPath);
      
      console.log(`✓ Created: ${outputPath}\n`);
    } catch (error) {
      console.error(`✗ Error processing ${threshold}m threshold:`, error.message);
    }
  }
  
  console.log('Demo completed! Check the generated files:');
  thresholds.forEach(t => console.log(`  - Seattle_${t}m.svg`));
}

if (require.main === module) {
  runDemo().catch(console.error);
}
