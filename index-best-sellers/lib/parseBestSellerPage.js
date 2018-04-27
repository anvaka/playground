module.exports = function parseBestSellerPage($) {
  const results = {
    products: [],
    children: [],
    parents: []
  }
  const centerList = $('#zg_centerListWrapper');
  if (centerList.length) {
    parseOldPage($, results);
  } else {
    parseNewPage($, results)
  }

  return results;
}

function parseOldPage($, results) {
  var centerList = $('#zg_centerListWrapper');
  var products = centerList.find('[data-p13n-asin-metadata]');

  Array.from(products).forEach(p => {
    const product = $(p);
    var raw = product.html();
    var productInfo = { raw };
    try {
      var asin = JSON.parse(product.attr('data-p13n-asin-metadata')).asin;
      var img = $(product.find('img'));
      productInfo.parsed = {
        asin,
        title: img.attr('alt'),
        img: img.attr('src')
      }
    } catch (e) {
      console.error('Failed to parse page', e);
    }

    results.products.push(productInfo);
  });
}

function parseNewPage($, results) {
  console.log($.html())
  throw new Error('implement me');
}