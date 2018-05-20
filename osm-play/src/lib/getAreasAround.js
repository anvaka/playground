import postData from './postData';

export default function getAreasAround(lonLat, bounds) {
  var sw = bounds.getSouthWest();
  var ne = bounds.getNorthEast()
  return postData('https://overpass-api.de/api/interpreter', 
    `[timeout:10][out:json];
is_in(${lonLat.lat}, ${lonLat.lng})->.a;
way(pivot.a);
out tags bb;
out ids geom(${sw.lat},${sw.lng},${ne.lat},${ne.lng});
relation(pivot.a);
out tags bb;`
  );
}