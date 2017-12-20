var puppeteer = require('puppeteer');
var browser, page;
var viewPort = {
  width: 500,
  height: 500
}
puppeteer.launch({args: ['--headless']})
  .then(saveBrowser)
  .then(runPageScript);

function saveBrowser(b) {
  browser = b;
  return browser.newPage()
}

function runPageScript(p) {
  page = p;
  page.setViewport(viewPort).then(navigateToPage);
}

function navigateToPage(){
  page.goto('https://anvaka.github.io/fieldplay').then(() => {
    // Let fieldplay play for a while
    setTimeout(takeScreenShotAndClose, 1000);
  })
}

function takeScreenShotAndClose() {
  page.$('#scene')
    .then(canvas => canvas.screenshot({path: 'example.png'}).then(() => browser.close()));
}