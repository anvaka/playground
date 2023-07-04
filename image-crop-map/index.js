import getImage from "./imageLayer.js";
var map = new maplibregl.Map({
  container: 'map',
});
const countryBackground = {
 //'Libya': 'https://cdn.discordapp.com/attachments/1015746254153728022/1125507475714613358/anvaka_the_most_stereotypical_person_in_Libya_d05ca085-27df-4522-b0f1-05a69e49b1a3.png',
 'Libya': 'https://media.discordapp.net/attachments/1015746254153728022/1125489597896474777/anvaka_the_most_stereotypical_person_in_Libya_65bf396a-11a9-48e3-902e-d50daf1b53e9.webp',
 'Ukraine': 'https://cdn.discordapp.com/attachments/1015746254153728022/1125533049178816572/anvaka_the_most_stereotypical_woman_in_Ukraine_5999c8b2-ec8a-4071-928a-c1f458c5101a.png',
 // 'Greenland': 'https://cdn.discordapp.com/attachments/1015746254153728022/1125535240476180570/anvaka_the_most_sterotypical_person_in_Greenland_fde08c2c-e7c6-44e6-af78-8ea7509adcd8.webp'
 //'Antarctica': 'https://media.discordapp.net/attachments/1015746254153728022/1125527164918452254/anvaka_the_most_stereotypical_person_in_Antarctica_7f00979c-503d-4b52-a86e-a6ab86f8dfbc.png?width=1034&height=1034'
}

loadAll()

async function loadAll() {
  let borders = await loadBorders();
  initMap(borders);
}

function loadBorders() {
  return fetch("https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson").then(res => res.json());
}

function initMap(borders) {
  map.addSource("borders", {
    "type": "geojson",
    "data": borders
  });

  map.addLayer({
    "id": "borders",
    "type": "line",
    "source": "borders",
    "layout": {},
    "paint": {
      "line-color": "#ff0000",
      "line-width": 1
    },
  });

  Object.keys(countryBackground).forEach(country => {
    let countryFeature = borders.features.find(f => f.properties.admin === country);
    addImage(countryBackground[country], countryFeature, 1);
  });
}

async function addImage(imageSrc, countryPolygon, variant) {
  let img;
  if (countryPolygon.geometry.type === "MultiPolygon") {
    let largestPolygon = getLargestPolygonGeoJSON(countryPolygon.geometry.coordinates);
    img = await clipImage(imageSrc, largestPolygon.coordinates[0]);
  } else if (countryPolygon.geometry.type === "Polygon") {
    img = await clipImage(imageSrc, countryPolygon.geometry.coordinates[0]);
  }
  const imgKey = `image-${countryPolygon.properties.admin}-${variant}`;
  map.addSource(imgKey, {
    "type": "image",
    "url": img.canvas.toDataURL(),
    "coordinates": img.coordinates
  });

  map.addLayer({
    "id": imgKey,
    "type": "raster",
    "source": imgKey,
    "paint": { "raster-opacity": 0.85 }
  });
}


async function clipImage(url, coordinates, variant = 3) {
  let img = await getImage(url);

  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  for (var coord of coordinates) {
    if (coord[0] < minLon) minLon = coord[0];
    if (coord[1] < minLat) minLat = coord[1];
    if (coord[0] > maxLon) maxLon = coord[0];
    if (coord[1] > maxLat) maxLat = coord[1];
  }

  const topLeft = mercator(minLon, maxLat);
  const bottomRight = mercator(maxLon, minLat);

  // Create canvas and context
  const canvas = document.createElement('canvas');
  const width = canvas.width = img.width/2;
  const height = canvas.height = img.height/2;

  const ctx = canvas.getContext('2d');

  clipContextToPolygon(ctx, coordinates, (pair) => {
    let projected = mercator(pair[0], pair[1]);
    return {
      x: (projected.x - topLeft.x) / (bottomRight.x - topLeft.x) * width, 
      y: (projected.y - topLeft.y) / (bottomRight.y - topLeft.y) * height
    };
  });

  // Draw the image
  let sx = 0, sy = 0;
  if (variant === 1 || variant === 3) sx += width;
  if (variant === 2 || variant === 3) sy += height;
  
  ctx.drawImage(img.img, sx, sy, width, height, 0, 0, width, height);
  return {
    canvas,
    coordinates: [
      [minLon, maxLat],
      [maxLon, maxLat],
      [maxLon, minLat],
      [minLon, minLat]
    ]
  };
}

function clipContextToPolygon(ctx, coordinates, project) {
  ctx.beginPath();

  var first = true;
  for (var pair of coordinates) {
    const p = project(pair);

    if (first) {
      ctx.moveTo(p.x, p.y);
      first = false;
    } else {
      ctx.lineTo(p.x, p.y);
    }
  }

  // Close and clip the path
  ctx.closePath();
  ctx.clip();
}


function getLargestPolygonGeoJSON(MultiPolygon) {
  let maxCoordinatesIndex = 0;
  let maxCoordinates = 0;
  for (let i = 0; i < MultiPolygon.length; i++) {
    let coordinates = MultiPolygon[i][0].length;
    if (coordinates > maxCoordinates) {
      maxCoordinates = coordinates;
      maxCoordinatesIndex = i;
    }
  }
  
  return {
    type: "Polygon",
    coordinates: MultiPolygon[maxCoordinatesIndex]
  };
}

function mercator(lon, lat) {
    // Earth radius
    var R = 6378137;
    var MAX = 85.0511287798;
    var DEG = Math.PI / 180;

    var sin = Math.sin(lat * DEG);
    if (Math.abs(sin) > 1) {
        sin = Math.sign(sin);
    }

    // Mercator projection
    var y = R * Math.log((1 + sin) / (1 - sin)) / 2;
    var x = R * lon * DEG;

    return {
        x: x,
        y: y
    };
}