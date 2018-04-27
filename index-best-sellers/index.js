var getPage = require('./lib/getPage');
var parseBestSellerPage = require('./lib/parseBestSellerPage');

getPage('https://www.amazon.com/best-sellers-books-Amazon/zgbs/books/')
  .then(parseBestSellerPage)
  .then(x => {
    console.log(x);
  })
