const PNG = require("pngjs").PNG;
const fs = require("fs");

const data = JSON.parse(fs.readFileSync(process.argv[2]));
const name = process.argv[3];
const u = data.u;
const v = data.v;

const width = u.Ni;
const height = u.Nj - 1;

const png = new PNG({
  colorType: 2,
  filterType: 4,
  width: width,
  height: height
});

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    const k = y * width + ((x + width / 2) % width);
    png.data[i + 0] = Math.floor(
      (255 * (u.values[k] - u.minimum)) / (u.maximum - u.minimum)
    );
    png.data[i + 1] = Math.floor(
      (255 * (v.values[k] - v.minimum)) / (v.maximum - v.minimum)
    );
    png.data[i + 2] = 0;
    png.data[i + 3] = 255;
  }
}

png.pack().pipe(fs.createWriteStream(name + ".png"));
