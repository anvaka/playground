/**
 * Adopted from https://github.com/timdream/wordcloud2.js by Andrei Kashcha
 *
 * Major changes:
 * - Rendering logic is removed from this module. This is in-memory algorithm.
 *   It still uses canvas (detached from DOM) to perform packing.
 *
 * - Deterministic randomness. The algorithm use the seeded PRNG (ngraph.random)
 *   Which allows to get consistent layouts between multiple reruns.
 *
 * Original worldcloud2.js license:
 *
 * wordcloud2.js
 * http://timdream.org/wordcloud2.js/
 *
 * Copyright 2011 - 2013 Tim Chien
 * Released under the MIT license
 */
var eventify = require('ngraph.events');
var getMinFontSize = require('./lib/getMinFontSize.js');
var getCanvasContextStrict = require('./lib/getCanvasContextStrict.js');
var randomAPI = require('ngraph.random');

module.exports = wordLayout;

var PI2 = Math.PI * 2;

function wordLayout(list, options) {
  var ctx = getCanvasContextStrict();

  var settings = getSettings(options, getDefaultSettings());

  var api = eventify({
    dispose: dispose
  });

  var minFontSize = getMinFontSize();

  /* shorthand */
  var g = settings.gridSize;

  /* normalize rotation settings */
  var rotationRange = Math.abs(settings.maxRotation - settings.minRotation);
  var minRotation = Math.min(settings.maxRotation, settings.minRotation);

  /* information/object available to all functions, set when start() */
  var grid, // 2d array containing filling information
    gridWidth,
    gridHeight, // width and height of the grid
    center, // position of the center of the cloud
    maxRadius;

  /* timestamp for measuring each putWord() action */
  var escapeTime;

  /* Get points on the grid for a given radius away from the center */
  var pointsAtRadius = [];
  var timerId;

  start();

  return api;

  function dispose() {
    if (timerId) {
      clearTimeout(timerId);
      timerId = 0;
    }
    // ctx.canvas.parentNode.removeChild(ctx.canvas);
  }

  function getTextInfo(word, weight, rotateDeg) {
    // calculate the acutal font size
    // fontSize === 0 means weightFactor function wants the text skipped,
    // and size < minSize means we cannot draw the text.
    var fontSize = settings.weightFactor(weight);
    if (fontSize <= settings.minSize) {
      return false;
    }

    // Scale factor here is to make sure fillText is not limited by
    // the minium font size set by browser.
    // It will always be 1 or 2n.
    var mu = 1;
    if (fontSize < minFontSize) {
      mu = (function calculateScaleFactor() {
        var mu = 2;
        while (mu * fontSize < minFontSize) {
          mu += 2;
        }
        return mu;
      })();
    }

    var fcanvas = document.createElement('canvas');
    var fctx = fcanvas.getContext('2d', { willReadFrequently: true });

    fctx.font = settings.fontWeight + ' ' + (fontSize * mu).toString(10) + 'px ' + settings.fontFamily;

    // Estimate the dimension of the text with measureText().
    var fw = fctx.measureText(word).width / mu;
    var fh = Math.max(fontSize * mu,
                      fctx.measureText('m').width,
                      fctx.measureText('\uFF37').width) / mu;

    // Create a boundary box that is larger than our estimates,
    // so text don't get cut of (it sill might)
    var boxWidth = fw + fh * 2;
    var boxHeight = fh * 3;
    var fgw = Math.ceil(boxWidth / g);
    var fgh = Math.ceil(boxHeight / g);
    boxWidth = fgw * g;
    boxHeight = fgh * g;

    // Calculate the proper offsets to make the text centered at
    // the preferred position.

    // This is simply half of the width.
    var fillTextOffsetX = - fw / 2;
    // Instead of moving the box to the exact middle of the preferred
    // position, for Y-offset we move 0.4 instead, so Latin alphabets look
    // vertical centered.
    var fillTextOffsetY = - fh * 0.4;

    // Calculate the actual dimension of the canvas, considering the rotation.
    var cgh = Math.ceil((boxWidth * Math.abs(Math.sin(rotateDeg)) +
                          boxHeight * Math.abs(Math.cos(rotateDeg))) / g) + 5;
    var cgw = Math.ceil((boxWidth * Math.abs(Math.cos(rotateDeg)) +
                          boxHeight * Math.abs(Math.sin(rotateDeg))) / g) + 5;
    var width = cgw * g;
    var height = cgh * g;

    fcanvas.setAttribute('width', width + 'px');
    fcanvas.setAttribute('height', height + 'px');

    // Scale the canvas with |mu|.
    fctx.scale(1 / mu, 1 / mu);
    fctx.translate(width * mu / 2, height * mu / 2);
    fctx.rotate(- rotateDeg);

    // Once the width/height is set, ctx info will be reset.
    // Set it again here.
    fctx.font = settings.fontWeight + ' ' + (fontSize * mu) + 'px ' + settings.fontFamily;

    // Fill the text into the fcanvas.
    // XXX: We cannot because textBaseline = 'top' here because
    // Firefox and Chrome uses different default line-height for canvas.
    // Please read https://bugzil.la/737852#c6.
    // Here, we use textBaseline = 'middle' and draw the text at exactly
    // 0.5 * fontSize lower.
    fctx.fillStyle = '#000';
    // fctx.textBaseline = 'middle';
    fctx.fillText(word, fillTextOffsetX * mu,
                  (fillTextOffsetY + fontSize * 0.5) * mu);

    // Get the pixels of the text
    var imageData = fctx.getImageData(0, 0, width, height).data;

    if (exceedTime()) {
      return false;
    }

    // Read the pixels and save the information to the occupied array
    var occupied = [];
    var gx = cgw, gy, x, y;
    var bounds = [cgh / 2, cgw / 2, cgh / 2, cgw / 2];
    while (gx--) {
      gy = cgh;
      while (gy--) {
        y = g;
        singleGridLoop: {
          while (y--) {
            x = g;
            while (x--) {
              if (imageData[((gy * g + y) * width +
                              (gx * g + x)) * 4 + 3]) {
                occupied.push([gx, gy]);

                if (gx < bounds[3]) {
                  bounds[3] = gx;
                }
                if (gx > bounds[1]) {
                  bounds[1] = gx;
                }
                if (gy < bounds[0]) {
                  bounds[0] = gy;
                }
                if (gy > bounds[2]) {
                  bounds[2] = gy;
                }

                break singleGridLoop;
              }
            }
          }
        }
      }
    }

    // Return information needed to create the text on the real canvas
    return {
      mu: mu,
      occupied: occupied,
      bounds: bounds,
      gw: cgw,
      gh: cgh,
      fillTextOffsetX: fillTextOffsetX,
      fillTextOffsetY: fillTextOffsetY,
      fillTextWidth: fw,
      fillTextHeight: fh,
      fontSize: fontSize
    };
  }

  /* Determine if there is room available in the given dimension */
  function canFitText(gx, gy, gw, gh, occupied) {
    // Go through the occupied points,
    // return false if the space is not available.
    var i = occupied.length;
    while (i--) {
      var px = gx + occupied[i][0];
      var py = gy + occupied[i][1];

      if (px >= gridWidth || py >= gridHeight || px < 0 || py < 0) {
        if (!settings.drawOutOfBound) {
          return false;
        }
        continue;
      }

      if (!grid[px][py]) {
        return false;
      }
    }
    return true;
  }

  /* Actually draw the text on the grid */
  function drawText(gx, gy, info, word, weight, distance, theta, rotateDeg) {
    var fontSize = info.fontSize;
    var color = settings.getTextColor(word, weight, fontSize, distance, theta);

    var mu = info.mu;
    var transform = {
      scale: 1/mu,
      translate: {
        x: (gx + info.gw * 0.5) * g * mu,
        y: (gy + info.gh * 0.5) * g * mu
      },
      rotate: -rotateDeg,
      x: info.fillTextOffsetX * mu,
      y: (info.fillTextOffsetY  + fontSize * 0.5) * mu,
      fontSize: info.fontSize * mu,
      fontFamily: settings.fontFamily,
      color: color
    };

    drawWord(transform, word, ctx)

    return transform;

    function drawWord(transform, word, ctx) {
      // Save the current state before messing it
      ctx.save();
      ctx.scale(transform.scale, transform.scale);

      ctx.font = settings.fontWeight + ' ' +
                  transform.fontSize + 'px ' + settings.fontFamily;
      ctx.fillStyle = color;

      // Translate the canvas position to the origin coordinate of where
      // the text should be put.
      ctx.translate(transform.translate.x, transform.translate.y);

      if (rotateDeg !== 0) {
        ctx.rotate(transform.rotate);
      }

      // Finally, fill the text.

      // XXX: We cannot because textBaseline = 'top' here because
      // Firefox and Chrome uses different default line-height for canvas.
      // Please read https://bugzil.la/737852#c6.
      // Here, we use textBaseline = 'middle' and draw the text at exactly
      // 0.5 * fontSize lower.
      // ctx.textBaseline = 'middle';
      ctx.fillText(word, transform.x, transform.y);

      // The below box is always matches how <span>s are positioned
      /* ctx.strokeRect(info.fillTextOffsetX, info.fillTextOffsetY,
        info.fillTextWidth, info.fillTextHeight); */

      // Restore the state.
      ctx.restore();
    }
  }

  /* Start drawing on a canvas */
  function start() {
    gridWidth = Math.ceil(settings.width / g);
    gridHeight = Math.ceil(settings.height / g);

    // Sending a wordcloudstart event which cause the previous loop to stop.
    // Do nothing if the event is canceled.
    if (!api.fire('wordcloudstart', true)) {
      return;
    }

    // Determine the center of the word cloud
    center = (settings.origin) ?
      [settings.origin[0]/g, settings.origin[1]/g] :
      [gridWidth / 2, gridHeight / 2];

    // Maxium radius to look for space
    maxRadius = Math.floor(Math.sqrt(gridWidth * gridWidth + gridHeight * gridHeight));

    grid = [];

    var gx, gy, i;
    ctx.fillStyle = settings.backgroundColor;
    ctx.clearRect(0, 0, gridWidth * (g + 1), gridHeight * (g + 1));
    ctx.fillRect(0, 0, gridWidth * (g + 1), gridHeight * (g + 1));

    /* fill the grid with empty state */
    gx = gridWidth;
    while (gx--) {
      grid[gx] = [];
      gy = gridHeight;
      while (gy--) {
        grid[gx][gy] = true;
      }
    }

    i = 0;

    timerId = setTimeout(loop, settings.wait);

    return;

    function loop() {
      if (i >= list.length) {
        clearTimeout(timerId);
        api.fire('wordcloudstop', false);

        return;
      }
      escapeTime = (new Date()).getTime();
      var drawn = putWord(list[i]);
      var canceled = !api.fire('wordclouddrawn', drawn, list[i]);

      if (exceedTime() || canceled) {
        clearTimeout(timerId);
        settings.abort();
        api.fire('wordcloudabort', false);
        api.fire('wordcloudstop', false);
        return;
      }
      i++;
      timerId = setTimeout(loop, settings.wait);
    }
  }


  /* putWord() processes each item on the list,
      calculate it's size and determine it's position, and actually
      put it on the canvas. */
  function putWord(item) {
    var word, weight;
    if (Array.isArray(item)) {
      word = item[0];
      weight = item[1];
    } else {
      word = item.word;
      weight = item.weight;
    }
    var rotateDeg = getRotateDeg();

    // get info needed to put the text onto the canvas
    var info = getTextInfo(word, weight, rotateDeg);

    // not getting the info means we shouldn't be drawing this one.
    if (!info) {
      return false;
    }

    if (exceedTime()) {
      return false;
    }

    // If drawOutOfBound is set to false,
    // skip the loop if we have already know the bounding box of
    // word is larger than the canvas.
    if (!settings.drawOutOfBound) {
      var bounds = info.bounds;
      if ((bounds[1] - bounds[3] + 1) > gridWidth ||
        (bounds[2] - bounds[0] + 1) > gridHeight) {
        return false;
      }
    }

    // Determine the position to put the text by
    // start looking for the nearest points
    var r = maxRadius + 1;

    while (r--) {
      var points = getPointsAtRadius(maxRadius - r);

      // Try to fit the words by looking at each point.
      // array.some() will stop and return true
      // when putWordAtPoint() returns true.
      // If all the points returns false, array.some() returns false.
      var transform;
      forEachInRandomOrder(points, point => {
        transform = tryToPutWordAtPoint(point);
        // quit early if can
        if (transform) return true;
      })

      if (transform) return transform;
    }
    // we tried all distances but text won't fit, return false
    return false;

    function forEachInRandomOrder(array, callback) {
      var i, j, t;
      for (i = array.length - 1; i > 0; --i) {
        j = settings.random.next(i + 1); // i inclusive
        t = array[j];
        array[j] = array[i];
        array[i] = t;

        var stop = callback(t);
        if (stop) return;
      }

      if (array.length) {
          callback(array[0]);
      }
    }

    function tryToPutWordAtPoint(gxy) {
      var gx = Math.floor(gxy[0] - info.gw / 2);
      var gy = Math.floor(gxy[1] - info.gh / 2);
      var gw = info.gw;
      var gh = info.gh;

      // If we cannot fit the text at this position, return false
      // and go to the next position.
      if (!canFitText(gx, gy, gw, gh, info.occupied)) {
        return false;
      }

      // Actually put the text on the canvas
      var transform = drawText(gx, gy, info, word, weight,
                (maxRadius - r), gxy[2], rotateDeg);

      // Mark the spaces on the grid as filled
      updateGrid(gx, gy, gw, gh, info, item);

      // Return true so some() will stop and also return true.
      return transform;
    }
  }


  /* Update the filling information of the given space with occupied points.
      Draw the mask on the canvas if necessary. */
  function updateGrid(gx, gy, gw, gh, info, item) {
    var occupied = info.occupied;

    var dimension;

    var i = occupied.length;
    while (i--) {
      var px = gx + occupied[i][0];
      var py = gy + occupied[i][1];

      if (px >= gridWidth || py >= gridHeight || px < 0 || py < 0) {
        continue;
      }

      fillGridAt(px, py, dimension, item);
    }
  }

  /* Help function to updateGrid */
  function fillGridAt(x, y) {
    if (x >= gridWidth || y >= gridHeight || x < 0 || y < 0) {
      return;
    }

    grid[x][y] = false;
  }

  function getPointsAtRadius(radius) {
    if (pointsAtRadius[radius]) {
      return pointsAtRadius[radius];
    }

    // Look for these number of points on each radius
    var T = radius * 8;

    // Getting all the points at this radius
    var t = T;
    var points = [];

    if (radius === 0) {
      points.push([center[0], center[1], 0]);
    }

    while (t--) {
      // distort the radius to put the cloud in shape
      var rx = 1;
      var alpha = t / T * PI2;
      if (settings.shape !== 'circle') {
        rx = settings.shape(alpha); // 0 to 1
      }

      // Push [x, y, t]; t is used solely for getTextColor()
      points.push([
        center[0] + radius * rx * Math.cos(-alpha),
        center[1] + radius * rx * Math.sin(-alpha) * settings.ellipticity,
        alpha]);
    }

    pointsAtRadius[radius] = points;
    return points;
  }

  /* Return true if we had spent too much time */
  function exceedTime() {
    return ((settings.abortThreshold > 0) &&
      ((new Date()).getTime() - escapeTime > settings.abortThreshold));
  }

  /* Get the deg of rotation according to settings, and luck. */
  function getRotateDeg() {
    if (settings.rotateRatio === 0) {
      return 0;
    }

    if (settings.random.nextDouble() > settings.rotateRatio) {
      return 0;
    }

    if (rotationRange === 0) {
      return minRotation;
    }

    return minRotation + settings.random.nextDouble() * rotationRange;
  }
}

function getSettings(customSettings, settings) {
  mergeCustomSettings();

  /* Make sure gridSize is a whole number and is not smaller than 4px */
  settings.gridSize = Math.max(Math.floor(settings.gridSize), 4);
  settings.random = randomAPI.random(settings.seed);

  convertWeightFactorIntoFunction();
  convertShapeIntoFunction();
  convertColorIntoFunction();

  return settings;

  function mergeCustomSettings() {
    if (customSettings) {
      for (var key in customSettings) {
        if (key in settings) {
          settings[key] = customSettings[key];
        }
      }
    }
  }

  /* Convert weightFactor into a function */
  function convertWeightFactorIntoFunction() {
    if (typeof settings.weightFactor !== 'function') {
      var factor = settings.weightFactor;
      settings.weightFactor = function weightFactor(pt) {
        return pt * factor; //in px
      };
    }
  }

  /* Convert shape into a function */
  function convertShapeIntoFunction() {
    if (typeof settings.shape !== 'function') {
      switch (settings.shape) {
        case 'circle':
        /* falls through */
        default:
          // 'circle' is the default and a shortcut in the code loop.
          settings.shape = 'circle';
          break;

        case 'cardioid':
          settings.shape = function shapeCardioid(theta) {
            return 1 - Math.sin(theta);
          };
          break;

        /*

        To work out an X-gon, one has to calculate "m",
        where 1/(cos(2*PI/X)+m*sin(2*PI/X)) = 1/(cos(0)+m*sin(0))
        http://www.wolframalpha.com/input/?i=1%2F%28cos%282*PI%2FX%29%2Bm*sin%28
        2*PI%2FX%29%29+%3D+1%2F%28cos%280%29%2Bm*sin%280%29%29

        Copy the solution into polar equation r = 1/(cos(t') + m*sin(t'))
        where t' equals to mod(t, 2PI/X);

        */

        case 'diamond':
        case 'square':
          // http://www.wolframalpha.com/input/?i=plot+r+%3D+1%2F%28cos%28mod+%28t%2C+PI%2F2%29%29%2Bsin%28mod+%28t%2C+PI%2F2%29%29%29%2C+t+%3D+0+..+2*PI
          settings.shape = function shapeSquare(theta) {
            var thetaPrime = theta % (2 * Math.PI / 4);
            return 1 / (Math.cos(thetaPrime) + Math.sin(thetaPrime));
          };
          break;

        case 'triangle-forward':
          // http://www.wolframalpha.com/input/?i=plot+r+%3D+1%2F%28cos%28mod+%28t%2C+2*PI%2F3%29%29%2Bsqrt%283%29sin%28mod+%28t%2C+2*PI%2F3%29%29%29%2C+t+%3D+0+..+2*PI
          settings.shape = function shapeTriangle(theta) {
            var thetaPrime = theta % (2 * Math.PI / 3);
            return 1 / (Math.cos(thetaPrime) +
              Math.sqrt(3) * Math.sin(thetaPrime));
          };
          break;

        case 'triangle':
        case 'triangle-upright':
          settings.shape = function shapeTriangle(theta) {
            var thetaPrime = (theta + Math.PI * 3 / 2) % (2 * Math.PI / 3);
            return 1 / (Math.cos(thetaPrime) +
              Math.sqrt(3) * Math.sin(thetaPrime));
          };
          break;

        case 'pentagon':
          settings.shape = function shapePentagon(theta) {
            var thetaPrime = (theta + 0.955) % (2 * Math.PI / 5);
            return 1 / (Math.cos(thetaPrime) +
              0.726543 * Math.sin(thetaPrime));
          };
          break;

        case 'star':
          settings.shape = function shapeStar(theta) {
            var thetaPrime = (theta + 0.955) % (2 * Math.PI / 10);
            if ((theta + 0.955) % (2 * Math.PI / 5) - (2 * Math.PI / 10) >= 0) {
              return 1 / (Math.cos((2 * Math.PI / 10) - thetaPrime) +
                3.07768 * Math.sin((2 * Math.PI / 10) - thetaPrime));
            } else {
              return 1 / (Math.cos(thetaPrime) +
                3.07768 * Math.sin(thetaPrime));
            }
          };
          break;
      }
    }
  }

  function convertColorIntoFunction() {
    /* function for getting the color of the text */
    var getTextColor;
    switch (settings.color) {
      case 'random-dark':
        getTextColor = function getRandomDarkColor() {
          return random_hsl_color(10, 50, settings.random);
        };
        break;

      case 'random-light':
        getTextColor = function getRandomLightColor() {
          return random_hsl_color(50, 90, settings.random);
        };
        break;

      default:
        if (typeof settings.color === 'function') {
          getTextColor = settings.color;
        } else if (typeof settings.color === 'string') {
          getTextColor = function() { return settings.color; }
        }
        break;
    }

    settings.getTextColor = getTextColor
  }
}

function getDefaultSettings() {
  return {
    fontFamily: '"Arial Unicode MS", sans-serif',
    fontWeight: 'normal',
    color: 'random-dark',
    minSize: 0, // 0 to disable
    seed: 42,
    weightFactor: 1,
    backgroundColor: '#fff', // opaque white = rgba(255, 255, 255, 1)

    width: 800,
    height: 600,

    gridSize: 8,
    drawOutOfBound: false,
    origin: null,

    maskColor: 'rgba(255,0,0,0.3)',
    maskGapWidth: 0.3,

    wait: 0,
    abortThreshold: 0, // disabled
    abort: function noop() {},

    minRotation: -Math.PI / 2,
    maxRotation: Math.PI / 2,

    rotateRatio: 0.1,

    shape: 'circle',
    ellipticity: 0.65,

    classes: null,

    hover: null,
    click: null
  }
}

function random_hsl_color(min, max, random) {
  return 'hsl(' +
    (random.next(360)).toFixed() + ',' +
    (random.next(30) + 70).toFixed() + '%,' +
    (random.next(max - min) + min).toFixed() + '%)';
}
