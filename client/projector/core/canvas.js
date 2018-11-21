/*globals WithAll, When, Claim */

module.exports = function() {
  const { getCssTransform } = require('../positioning');

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
    canvas.style.transformOrigin = '0 0 0';
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
};
