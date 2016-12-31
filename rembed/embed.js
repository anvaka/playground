var scripts = document.getElementsByTagName('script');
var index = scripts.length - 1;
var myScript = scripts[index];
var queryString = myScript.src.split('?')[1];
var query = parseQuery(queryString);

request('https://reddit.com/r/' + query.r + '/.json').then(function(data) {
  console.log(data);
})

function parseQuery(qstr) {
  var query = {};
  var a = qstr.split('&');
  for (var i = 0; i < a.length; i++) {
    var b = a[i].split('=');
    query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
  }

  return query;
}

/**
 * A very basic ajax client with promises and progress reporting.
 */
function request(url, options) {
  return $.ajax({
    url: url,
    dataType: 'jsonp',
    jsonp: 'jsonp',
    timeout: 15000,
  });
}
