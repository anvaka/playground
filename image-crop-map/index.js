import getImage from "./imageLayer.js";
// import discordClient from "./discordClient.js";

var map = new maplibregl.Map({
  container: 'map',
  zoom: 1,
  minZoom: 1,
});
const countryBackground = {
 //'Libya': 'https://cdn.discordapp.com/attachments/1015746254153728022/1125507475714613358/anvaka_the_most_stereotypical_person_in_Libya_d05ca085-27df-4522-b0f1-05a69e49b1a3.png',
 'Libya': 'https://media.discordapp.net/attachments/1015746254153728022/1125489597896474777/anvaka_the_most_stereotypical_person_in_Libya_65bf396a-11a9-48e3-902e-d50daf1b53e9.webp',
 'Mexico': 'https://cdn.discordapp.com/attachments/1057168562155950095/1125681246886973491/anvaka_most_stereotypical_person_in_Mexico_2464780d-0655-44d2-93b3-bf5e38e8386a.png',
 'Canada': 'https://cdn.discordapp.com/attachments/1057168562155950095/1125675798054043709/anvaka_most_typical_man_in_Canada_a2cc54c4-433e-48c2-933f-a9ac88b7763d.png',
//  'Ukraine': 'https://cdn.discordapp.com/attachments/1015746254153728022/1125533049178816572/anvaka_the_most_stereotypical_woman_in_Ukraine_5999c8b2-ec8a-4071-928a-c1f458c5101a.png',
 // 'Greenland': 'https://cdn.discordapp.com/attachments/1015746254153728022/1125535240476180570/anvaka_the_most_sterotypical_person_in_Greenland_fde08c2c-e7c6-44e6-af78-8ea7509adcd8.webp'
// 'Antarctica': 'https://media.discordapp.net/attachments/1015746254153728022/1125527164918452254/anvaka_the_most_stereotypical_person_in_Antarctica_7f00979c-503d-4b52-a86e-a6ab86f8dfbc.png?width=1034&height=1034'
// '': 'images/',
'Turkey': 'images/anvaka_Most_stereotypical_person_in_Turkey_862f160f-7411-406e-92f9-d97ce04c9f4d.webp',
'United Republic of Tanzania': 'images/anvaka_Most_stereotypical_person_in_United_Republic_of_Tanzania_fe8c0aec-f372-4786-83a7-15d737b86db7.png',
'Taiwan': 'images/anvaka_Most_stereotypical_person_in_Taiwan_6b4fbbd2-095e-476a-93a5-c923b76cd5cf.png',
'Ukraine': 'images/anvaka_Most_stereotypical_person_in_Ukraine_dcf6bfb5-e4c0-4fcb-bab8-229c3d105764.webp',
'Uganda': 'images/anvaka_Most_stereotypical_person_in_Uganda_703f53ea-4c36-43b7-ab40-b8883a1040a6.png',
'Uruguay': 'images/anvaka_Most_stereotypical_person_in_Uruguay_de1a0ec5-5fb4-474b-b53a-64201b50bea7.png',
'United States of America': 'images/anvaka_Most_stereotypical_person_in_United_States_of_America_2cb4ce69-9f04-402e-8707-c1ccfc6342ba.png',
'Uzbekistan': 'images/anvaka_Most_stereotypical_person_in_Uzbekistan_bdcf92bf-a3bb-4e85-836c-f9f4c331053c.webp',
'Venezuela': 'images/anvaka_Most_stereotypical_person_in_Venezuela_b3fd47d9-92c9-4301-bd60-b889b742c024.png',
'Vietnam': 'images/anvaka_Most_stereotypical_person_in_Vietnam_62db39f1-aa95-4a06-9670-8aab4b7dc712.webp',
'Vanuatu': 'images/anvaka_Most_stereotypical_person_in_Vanuatu_830d0208-f8ea-45f9-aaac-81bd025e5522.webp',
'Yemen': 'images/anvaka_Most_stereotypical_person_in_Yemen_5cac87ec-d592-434f-966e-f03f68b4a3ad.webp',
"South Africa": 'https://cdn.discordapp.com/attachments/1015746254153728022/1125922700767006801/anvaka_Most_stereotypical_person_in_South_Africa_c22f0256-2538-4f2a-8dc5-f866d877b623.png',
'Zambia': 'https://cdn.discordapp.com/attachments/1015746254153728022/1125922532659302431/anvaka_Most_stereotypical_person_in_Zambia_2570a342-2289-4d73-af73-beaa88da7567.png',
'Zimbabwe': 'https://cdn.discordapp.com/attachments/1015746254153728022/1125920396101820536/anvaka_Most_stereotypical_person_in_Zimbabwe_c03a654d-f3d6-4ff7-a4ec-f63691e670fa.png',
}

loadAll()

async function loadAll() {
  let borders = await loadBorders();
  borders.features.forEach(b => {
    if (!countryBackground[b.properties.admin]) {
      console.log(`/imagine prompt:"Most stereotypical person in ${b.properties.admin}"`);
    }
  });
  initMap(borders);
}

function loadBorders() {
  const bounds_50 = 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson';
  const bounds = 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson';
  return fetch(bounds).then(res => res.json());
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

async function clipImage(url, coordinates, variant = 0) {
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
  // if (minLon <= -180) minLon = -179;
  // if (maxLon >= 180) maxLon = 179;
  // if (minLat >= -90) minLat = -89;

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