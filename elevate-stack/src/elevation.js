export function loadImage(url) {
  return new Promise((accept, error) => {
    const img = new Image();
    img.onload = () => {
      accept(img);
    };
    img.onerror = error;
    img.crossOrigin = "anonymous";
    img.src = url;
  });
}

export function getRegion(startTileLat, startTileLng, endTileLat, endTileLng, zoom, apiURL) {
  // const canvas1 = document.createElement("canvas");
  // const ctx1 = canvas1.getContext('2d');
  // ctx1.width = canvas1.width = 512;
  // ctx1.height = canvas1.height = 683;
  // return loadImage('http://127.0.0.1:8081/cat.png')
  //     .then(image => {
  //       ctx1.drawImage(image, 0, 0);
  //       return canvas1;
  //     });

  startTileLat = Math.floor(startTileLat);
  startTileLng = Math.floor(startTileLng);
  endTileLat = Math.floor(endTileLat);
  endTileLng = Math.floor(endTileLng);

  if (startTileLng > endTileLng) {
    let t = startTileLng;
    startTileLng = endTileLng;
    endTileLng = t;
  }
  if (startTileLat > endTileLat) {
    let t = startTileLat;
    startTileLat = endTileLat;
    endTileLat = t;
  }

  const canvas = document.createElement("canvas");
  const width = endTileLng - startTileLng + 1;
  const height = endTileLat - startTileLat + 1;
  if (width > 5 || height > 5) throw new Error('check the tiling')
  const scaler = 1;
  canvas.width = width * scaler * 256;
  canvas.height = height * scaler * 256;
  let work = [];
  for (let x = 0; x < width; x++) {
    let _tLong = startTileLng + x;

    let startLng = tile2long(_tLong, zoom);
    if (startLng < -180) {
      startLng = 360 + startLng;
      _tLong = Math.floor(long2tile(startLng, zoom));
    } else if (startLng >= 180) {
      startLng = startLng - 360;
      _tLong = Math.floor(long2tile(startLng, zoom));
    }

    for (let y = 0; y < height; y++) {
      let _tLat = startTileLat + y;

      const url = apiURL
        .replace("zoom", zoom)
        .replace("tLat", _tLat)
        .replace("tLong", _tLong);

        work.push({
          url: url,
          x: x * scaler * 256,
          y: y * scaler * 256
        })
    }
  }

  const ctx = canvas.getContext('2d');

  return Promise.all(work.map(request => {
    return loadImage(request.url)
      .then(image => {
        ctx.drawImage(image, request.x, request.y);
      }).catch(e => {
        ctx.beginPath();
        ctx.fillStyle = '#0186a0'; // zero height
        ctx.fillRect(request.x, request.y, scaler * 256, scaler * 256);
      });
  })).then(() => {
    return canvas;
  });
}

export function long2tile(l, zoom) {
  let result = ((l + 180) / 360) * Math.pow(2, zoom);
  return result;
}

export function lat2tile(l, zoom) {
  return (
    ((1 -
      Math.log(
        Math.tan((l * Math.PI) / 180) + 1 / Math.cos((l * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
    Math.pow(2, zoom)
  );
}

export function tile2long(x, zoom) {
  return (x / Math.pow(2, zoom)) * 360 - 180;
}