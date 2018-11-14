const { forwardProjectionMatrixForPoints } = require('../utils');

export function getCssTransform({ points, paperWidth, paperHeight }) {
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
      { x: width - 1, y: 0 },
      { x: width - 1, y: height - 1 },
      { x: 0, y: height - 1 },
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
