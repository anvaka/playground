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
    var productInfo = { raw, variant: 1 };
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

  parseTree($, results);
}

function parseNewPage($, results) {
  var products = $('.zg-item');
  Array.from(products).forEach(p => {
    const product = $(p);
    var productInfo = {
      raw: product.html(),
      variant: 2
    };
    const img = $(product.find('a img'));
    const title = img.attr('alt');
    const imgUrl = img.attr('src');
    const href = $(img.parent().parent().parent()).attr('href');
    const asin = getAsinFromHref(href);
    productInfo.parsed = {
      asin,
      title,
      img: imgUrl
    };

    results.products.push(productInfo);
  });

  parseTree($, results);
}

function getAsinFromHref(href) {
  if (!href) throw new Error('No href');
  const match = href.match(/\/(.{10})\/ref/);
  if (!match) throw new Error('no match ' + href);

  return match[1];
}

function parseTree($, results) {
  var path = getPath($);
  var currentNode = $('span.zg_selected');
  path.push(currentNode.html().trim());
  var children = Array.from(currentNode.parent().parent().find('ul li a'));
  children.forEach(child => {
    var aTag = $(child)
    results.children.push({
      href: aTag.attr('href').replace(/\/ref=zg.+$/, ''),
      name: aTag.text()
    });
  });
  results.parents = results.parents.concat(path);
}

function getPath($, parents) {
  var parents = Array.from($('.zg_browseUp'));
  var path = [];
  parents.forEach(p => {
    var nameTag = $($(p).find('a'));
    path.push(nameTag.html());
  });
  return path;
}
