# Elevation SVG Processor

A Node.js application that processes SVG files with heightmap data to color paths based on elevation thresholds.

## Features

- Reads PNG heightmap files with elevation data
- Parses SVG files to extract path elements
- Colors line segments below a specified height threshold in red
- Preserves original colors for segments above the threshold
- Automatically extracts height range from filename format

## Installation

```bash
npm install
```

## Usage

```bash
node index.js <heightmap.png> <input.svg> <height_threshold> [output.svg]
```

### Parameters

- `heightmap.png`: PNG heightmap file with format `*_MinmMaxm.png` (e.g., `seattle_heightmap_-0m-144m.png`)
- `input.svg`: Input SVG file containing paths to process
- `height_threshold`: Height in meters - paths below this elevation will be colored red
- `output.svg`: Optional output filename (defaults to `output.svg`)

### Example

```bash
node index.js seattle_heightmap_-0m-144m.png Seattle.svg 50 Seattle_processed.svg
```

This will:
1. Load the heightmap with elevation range from 0m to 144m
2. Process the Seattle.svg file
3. Color all paths below 50m elevation in red
4. Save the result as Seattle_processed.svg

## How It Works

1. **Heightmap Processing**: The application reads the PNG heightmap and converts grayscale values to elevation data based on the filename's height range
2. **SVG Parsing**: The SVG file is parsed to extract path elements and their coordinate data
3. **Height Sampling**: For each path, multiple points are sampled to determine the average elevation
4. **Color Assignment**: Paths with average elevation below the threshold are colored red
5. **Output Generation**: A new SVG file is created with the modified colors

## File Format Requirements

### Heightmap Files
- Must be PNG format
- Filename must end with `_MinmMaxm.png` (e.g., `_-0m-144m.png`)
- Should be grayscale where darker values represent lower elevations
- Dimensions should match the SVG viewBox

### SVG Files
- Standard SVG format with path elements
- ViewBox dimensions should match the heightmap dimensions
- Paths should use stroke colors (fill colors are not modified)

## Dependencies

- `jimp`: Image processing library for reading PNG files
- `xml2js`: XML parsing and building for SVG manipulation
