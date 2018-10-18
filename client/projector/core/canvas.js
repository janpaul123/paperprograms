/*globals WithAll, When, Claim */

module.exports = function() {
  const { forwardProjectionMatrixForPoints } = require('../../utils');

  When` {someone} wishes {paper} has canvas with name {canvasName},
        {paper} has corner points {points},
        {paper} has width {paperWidth},
        {paper} has height {paperHeight}`(
    ({ paper, paperWidth, paperHeight, points, canvasName }) => {
      const canvas = getCanvasElement(paper, canvasName);
      canvas.width = paperWidth;
      canvas.height = paperHeight;
      canvas.style.transform = getCssTransform({
        points,
        paperHeight,
        paperWidth,
      });

      Claim`${paper} has canvas ${canvas} with name ${canvasName}`;
    }
  );

  WithAll` {someone} wishes {object} has canvas with name {canvasName} `(matches => {
    const activeCanvasElements = {};
    matches.forEach(({ object, canvasName }) => {
      activeCanvasElements[`${object}[${canvasName}]`] = true;
    });

    // remove canvases which are not active
    Object.keys(canvasElements).forEach(key => {
      if (!activeCanvasElements[key]) {
        removeCanvasElementByKey(key);
      }
    });
  });

  // canvas creation

  const canvasElements = {};

  function getCanvasElement(object, name) {
    const key = `${object}[${name}]`;

    if (canvasElements[key]) {
      return canvasElements[key];
    }

    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    document.body.appendChild(canvas);
    canvasElements[key] = canvas;

    return canvas;
  }

  function removeCanvasElementByKey(key) {
    if (!canvasElements[key]) {
      return;
    }

    document.body.removeChild(canvasElements[key]);
    delete canvasElements[key];
  }

  // 3d transforms

  function getCssTransform({ points, paperWidth, paperHeight }) {
    return matrixToCssTransform(
      forwardProjectionMatrixForPoints(Object.values(points)).multiply(
        getSizeMatrix(paperWidth, paperHeight)
      )
    );
  }

  const sizeMatrixCache = {};

  function getSizeMatrix(width, height) {
    const key = `${width},${height}`;
    sizeMatrixCache[key] =
      sizeMatrixCache[key] ||
      forwardProjectionMatrixForPoints([
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height },
      ]).adjugate();
    return sizeMatrixCache[key];
  }

  function matrixToCssTransform(matrix) {
    // prettier-ignore
    const values = [
      matrix.get(0, 0), matrix.get(1, 0), 0, matrix.get(2, 0),
      matrix.get(0, 1), matrix.get(1, 1), 0, matrix.get(2, 1),
      0, 0, 1, 0,
      matrix.get(0, 2), matrix.get(1, 2), 0, matrix.get(2, 2),
    ];
    return `matrix3d(${values.join(',')})`;
  }
};
