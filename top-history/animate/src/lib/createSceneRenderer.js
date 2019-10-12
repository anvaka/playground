import formatNumber from "./formatNumber";
import { getHumanFriendlyTimeSinceCreation } from "./getHumanFriendlyTimeSinceCreation";

export default function createSceneRenderer(archive, canvas) {
  const AXIS_COLOR = 'black';
  const BACKGROUND_COLOR = '#EDEDED';
  const SECONDARY_COLOR = '#CFCFCF';
  const TERNARY_COLOR = '#66666633'
  const POINTER_COLOR = '#2D72B1';
  const DOT_COLOR_SELECTED = '#2D72B1'
  const DOT_COLOR_UNSELECTED = '#333'

  let width;
  let height;

  let scaleX, scaleY;
  let canvasBoundingClientRect;
  let paddingLeft;
  let paddingRight;
  let paddingTop;
  let paddingBottom;
  let sceneWidth;
  let sceneHeight;

  let xAxisYCoordinate;
  let yAxisXCoordinate;
  let selectedPostIndex = 0;

  updateDimensions();

  let currentPosts;
  let nearestCount = 15;
  let currentBandAndScore;

  const ctx = canvas.getContext('2d');
  ctx.font = `'Avenir', Helvetica, Arial, sans-serif`
  canvas.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('resize', onResize);

  return {
    getNearestCount: () => nearestCount,
    setNearestCount,
    dispose,
    renderPosts,
    selectPost
  }

  function updateDimensions() {
    let isSmall = window.innerWidth < 640;
    width = canvas.width = isSmall ? 480 : 640;
    height = canvas.height = isSmall ? 320 : 480;

    paddingLeft = width * 0.07;
    paddingRight = width * 0.05;
    paddingTop = height * 0.08;
    paddingBottom = height * 0.10;
    sceneWidth = width - paddingLeft - paddingRight;
    sceneHeight = height - paddingTop - paddingBottom;

    xAxisYCoordinate = sceneHeight + paddingTop;
    yAxisXCoordinate = paddingLeft;

    canvasBoundingClientRect = canvas.getBoundingClientRect(),
    scaleX = canvas.width / canvasBoundingClientRect.width,
    scaleY = canvas.height / canvasBoundingClientRect.height;
  }

  function setNearestCount(newNeighborsToLookup) {
    if (newNeighborsToLookup < 1) throw new Error('At least one nearest neighbor is required');
    nearestCount = newNeighborsToLookup;
    redraw();
  }

  function dispose() {
    canvas.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('resize', onResize);
  }

  function onResize() {
    updateDimensions();
    redraw();
  }

  function renderPosts(posts) {
    currentPosts = posts;
    redraw();
  }

  function selectPost(post) {
    currentBandAndScore = {
      band: post.band,
      score: post.score
    },
    selectedPostIndex = post.index;
    redraw();
  }

  function handleMouseMove(e) {
    let x = (e.offsetX) * scaleX;
    let y = (e.offsetY) * scaleY;
    currentBandAndScore = getBandAndScoreFromCanvasCoordinates(x, y);
    redraw();
  }

  function redraw() {
    clearScene();
    drawAxes();

    const neighbors = archive.findNeighborsInBand(currentBandAndScore, nearestCount);
    drawNeighbors(neighbors, currentBandAndScore);
    drawPosts();

    drawPointerAt(currentBandAndScore);
  }

  function drawPosts() {
    if (!currentPosts) return;
    currentPosts.forEach((post, idx) => {
      ctx.beginPath();
      let isSelected = idx === selectedPostIndex;
      ctx.fillStyle = isSelected ? DOT_COLOR_SELECTED : DOT_COLOR_UNSELECTED;
      const location = getMouseCoordinatesFromBandAndScore({
        band: post.band,
        score: post.score
      });
      ctx.arc(location.x, location.y, isSelected ? 5 : 2, 0, 2 * Math.PI);
      ctx.fill();
    })
  }

  function drawAxes() {
    drawYAxisAsScore();
    drawXAxisAsTime();
  }

  function drawYAxisAsScore() {
    ctx.beginPath();
    ctx.strokeStyle = AXIS_COLOR;
    const top = paddingTop - 20;

    ctx.moveTo(yAxisXCoordinate, xAxisYCoordinate);
    ctx.lineTo(yAxisXCoordinate, top);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = AXIS_COLOR;
    ctx.moveTo(yAxisXCoordinate, top);
    ctx.lineTo(yAxisXCoordinate - 3, top + 10);
    ctx.lineTo(yAxisXCoordinate + 3, top + 10);
    ctx.closePath();
    ctx.fill();
    if (currentBandAndScore && currentBandAndScore.score > 85000) return;
    ctx.textAlign = 'right';
    ctx.fillText('score', yAxisXCoordinate - 8, top + 10);
  }

  function drawXAxisAsTime() {
    ctx.beginPath();
    ctx.strokeStyle = AXIS_COLOR;
    const right = paddingLeft + sceneWidth + Math.min(paddingRight * 0.5, 20);
    ctx.moveTo(paddingLeft, xAxisYCoordinate);
    ctx.lineTo(right, xAxisYCoordinate);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = AXIS_COLOR;
    ctx.moveTo(right, xAxisYCoordinate);
    ctx.lineTo(right - 10, xAxisYCoordinate + 3);
    ctx.lineTo(right - 10, xAxisYCoordinate - 3);
    ctx.closePath();
    ctx.fill();
    ctx.textAlign = 'right';

    if (currentBandAndScore) {
      const labelPadding = currentBandAndScore.band > 230 ? 30 : 18;
      ctx.fillText('time since post creation', right, xAxisYCoordinate + labelPadding);
    }
  }

  function drawNeighbors(neighbors, referenceBandAndScore) {
    neighbors.forEach(x => {
      const postHistory = archive.getPostHistory(x.postId);

      const last = postHistory[postHistory.length - 1];
      drawPoints(postHistory, last.band > referenceBandAndScore.band &&
        last.score < referenceBandAndScore.score ? SECONDARY_COLOR : TERNARY_COLOR)
    });
  }

  function drawPoints(points, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    let moved = false;
    for (let i = 0; i < points.length; ++i) {
      const bandAndScore = points[i];
      const location = getMouseCoordinatesFromBandAndScore(bandAndScore);
      if (moved) ctx.lineTo(location.x, location.y);
      else {
        ctx.moveTo(location.x, location.y)
        moved = true;
      }
    }
    ctx.stroke();
  }

  function clearScene() {
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, width, height);
  }

  function drawPointerAt(bandAndScore) {
    if (!bandAndScore) return;

    const location = getMouseCoordinatesFromBandAndScore(bandAndScore)

    ctx.beginPath();
    ctx.strokeStyle = POINTER_COLOR;
    ctx.moveTo(location.x, location.y);
    ctx.lineTo(location.x, xAxisYCoordinate)
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillText(getHumanFriendlyTimeSinceCreation(bandAndScore.band), location.x, xAxisYCoordinate + 18);

    ctx.beginPath();
    ctx.strokeStyle = POINTER_COLOR;
    ctx.moveTo(location.x, location.y);
    ctx.lineTo(yAxisXCoordinate, location.y)
    ctx.stroke();
    ctx.textAlign = 'right';
    ctx.fillText(formatNumber(Math.round(bandAndScore.score)), yAxisXCoordinate - 8, location.y);

    ctx.beginPath();
    ctx.fillStyle = POINTER_COLOR;
    ctx.fillRect(location.x - 2, location.y - 2, 4, 4);
    ctx.stroke();

  }

  function getMouseCoordinatesFromBandAndScore(bandAndScore) {
    return  {
      x: paddingLeft + sceneWidth * bandAndScore.band / archive.STRIDE, 
      y: paddingTop + sceneHeight * (1 - bandAndScore.score / (archive.maxScore - archive.minScore))
    };
  }

  function getBandAndScoreFromCanvasCoordinates(mouseX, mouseY) {
    let band = Math.floor(archive.STRIDE * (mouseX - paddingLeft)/ sceneWidth);
    if (band < 0 || band >= archive.STRIDE) return;
    let score = (archive.maxScore - archive.minScore) * (1 - (mouseY - paddingTop) / sceneHeight);
    return {band, score};
  }

}

