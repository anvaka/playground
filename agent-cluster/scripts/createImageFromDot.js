import fromDot from 'ngraph.fromdot';
import fs from 'fs';
import createLayout from 'ngraph.forcelayout';
import {createCanvas} from 'canvas';

const filePath = process.argv[2];
const stepCount = 400;

if (!filePath) {
  console.error('Please provide path to dot file');
  process.exit(1);
}

const graph = fromDot(fs.readFileSync(filePath, 'utf8'));
console.log('Graph loaded with ' + graph.getNodesCount() + ' nodes and ' + graph.getLinksCount() + ' links');
console.log('Performing layout...')

const layout = createLayout(graph, {
  springLength: 30,
  springCoefficient: 0.0008,
  gravity: -1.2,
  theta: 1.2,
  dragCoefficient: 0.02,
  timeStep: 20
});

for (let i = 0; i < stepCount; ++i) {
  layout.step();
}

const boundingBox = layout.getGraphRect();
console.log('Generating image...');

let width = boundingBox.max_x - boundingBox.min_x;
let height = boundingBox.max_y - boundingBox.min_y;
const paddingX = width * 0.1;
const paddingY = height * 0.1;
width += paddingX * 2;
height += paddingY * 2;

const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#FFF';
ctx.fillRect(0, 0, width, height);

graph.forEachLink(link => {
  let from = layout.getNodePosition(link.fromId);
  let to = layout.getNodePosition(link.toId);
  ctx.strokeStyle = '#000000';
  ctx.beginPath();
  ctx.moveTo(from.x - boundingBox.min_x + paddingX, from.y - boundingBox.min_y + paddingY);
  ctx.lineTo(to.x - boundingBox.min_x + paddingX, to.y - boundingBox.min_y + paddingY);
  ctx.stroke();
});
graph.forEachNode(node => {
  let pos = layout.getNodePosition(node.id);
  let x = (pos.x - boundingBox.min_x) + paddingX;
  let y = (pos.y - boundingBox.min_y) + paddingY;
  ctx.fillStyle = node.data.color || '#000000';
  // draw circle:
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, 2 * Math.PI);
  ctx.fill();
}); 


const outPath = filePath.replace(/\.dot$/, '.png');
const out = fs.createWriteStream(outPath);
const stream = canvas.createPNGStream();
stream.pipe(out);
out.on('finish', () => console.log('Image saved to ' + outPath));
out.on('error', (err) => console.error(err));
