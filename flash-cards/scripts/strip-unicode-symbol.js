/**
 * Converts ids.txt to a more compact format by removing the redundant Unicode code point column.
 * 
 * Input format:  U+4E00<tab>一<tab>⿱一亅
 * Output format: 一<tab>⿱一亅
 * 
 * The code point can be derived from the character, so we only keep:
 * - Column 2: The character itself
 * - Column 3+: IDS decomposition(s)
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputPath = join(__dirname, '../data/ids.txt');
const outputPath = join(__dirname, '../data/ids-compact.txt');

const content = readFileSync(inputPath, 'utf-8');
const lines = content.split('\n');

const compactLines = lines.map(line => {
  // Preserve comments and empty lines
  if (line.startsWith('#') || line.trim() === '') {
    return line;
  }

  const parts = line.split('\t');
  if (parts.length < 3) {
    return line; // Malformed line, keep as-is
  }

  // Keep character (col 1) and IDS decomposition(s) (col 2+)
  const [, character, ...decompositions] = parts;
  return [character, ...decompositions].join('\t');
});

writeFileSync(outputPath, compactLines.join('\n'), 'utf-8');

// Calculate size reduction
const originalSize = Buffer.byteLength(content, 'utf-8');
const compactContent = compactLines.join('\n');
const compactSize = Buffer.byteLength(compactContent, 'utf-8');
const saved = originalSize - compactSize;
const percent = ((saved / originalSize) * 100).toFixed(1);

console.log(`Original: ${(originalSize / 1024).toFixed(1)} KB`);
console.log(`Compact:  ${(compactSize / 1024).toFixed(1)} KB`);
console.log(`Saved:    ${(saved / 1024).toFixed(1)} KB (${percent}%)`);
