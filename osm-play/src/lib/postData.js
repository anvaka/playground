const url = 'https://overpass-api.de/api/interpreter' ;

export default function postData(data) {
  return fetch(url, {
    body: 'data=' + encodeURIComponent(data),
    cache: 'no-cache',
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    method: 'POST',
    mode: 'cors', 
    redirect: 'follow', 
    referrer: 'no-referrer',
  })
  .then(response => response.json());
}