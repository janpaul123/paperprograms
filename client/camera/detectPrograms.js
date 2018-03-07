import colorDiff from 'color-diff';
import sortBy from 'lodash/sortBy';

import {
  add,
  clamp,
  cross,
  diff,
  div,
  forwardProjectionMatrixForPoints,
  mult,
  norm,
  projectPoint,
  shrinkPoints,
} from '../utils';
import { code8400 } from '../dotCodes';
import { colorNames, cornerNames } from '../constants';
import simpleBlobDetector from './simpleBlobDetector';

function colorToRGB(c) {
  return { R: Math.round(c[0]), G: Math.round(c[1]), B: Math.round(c[2]) };
}

function colorIndexForColor(matchColor, colors) {
  const colorsRGB = colors.map(colorToRGB);
  return colorsRGB.indexOf(colorDiff.closest(colorToRGB(matchColor), colorsRGB));
}

function shapeToId(colorIndexes) {
  return code8400.indexOf(colorIndexes.join('')) % (code8400.length / 4);
}

function shapeToCornerNum(colorIndexes) {
  return Math.floor(code8400.indexOf(colorIndexes.join('')) / (code8400.length / 4));
}

function line(ctx, src, dst, color) {
  // Meant to emulate cv.line to make porting code easier.
  ctx.beginPath();
  ctx.moveTo(src.x, src.y);
  ctx.lineTo(dst.x, dst.y);
  ctx.strokeStyle = color;
  ctx.stroke();
}

let projectPointToUnitSquarePreviousKnobPoints;
let projectPointToUnitSquarePreviousMatrix;
function projectPointToUnitSquare(point, cols, rows, knobPoints) {
  if (
    !projectPointToUnitSquarePreviousMatrix ||
    projectPointToUnitSquarePreviousKnobPoints !== knobPoints
  ) {
    projectPointToUnitSquarePreviousKnobPoints = knobPoints;
    projectPointToUnitSquarePreviousMatrix = forwardProjectionMatrixForPoints(
      knobPoints
    ).adjugate();
  }
  return projectPoint(div(point, { x: cols, y: rows }), projectPointToUnitSquarePreviousMatrix);
}

// Depth-first search until a streak of `lengthLeft` has been found.
// Should be initialised with at least one item in `shapeToFill`.
function findShape(shapeToFill, neighborIndexes, lengthLeft) {
  if (lengthLeft === 0) return true;

  const lastIndex = shapeToFill[shapeToFill.length - 1];
  for (const index of neighborIndexes[lastIndex]) {
    if (shapeToFill.includes(index)) continue;
    shapeToFill.push(index);
    if (findShape(shapeToFill, neighborIndexes, lengthLeft - 1)) return true;
    shapeToFill.pop();
  }

  return false;
}

function colorIndexesForShape(shape, keyPoints, colorsRGB) {
  const shapeColors = shape.map(keyPointIndex => keyPoints[keyPointIndex].color, colorsRGB);

  const closestColors = [];
  const remainingShapeColors = shapeColors.slice();
  colorsRGB.forEach(mainColor => {
    const closestColorIndex = colorIndexForColor(mainColor, remainingShapeColors);
    closestColors.push(remainingShapeColors[closestColorIndex]);
    remainingShapeColors.splice(closestColorIndex, 1);
  });

  return shapeColors.map(color => colorIndexForColor(color, closestColors));
}

export default function detectPrograms({ config, videoInput, dataToRemember, displayCtx }) {
  const startTime = Date.now();
  const cols = videoInput.height;
  const rows = videoInput.width;

  if (displayCtx) {
    displayCtx.clearRect(0, 0, displayCtx.canvas.width, displayCtx.canvas.height);

    const matrix = forwardProjectionMatrixForPoints(config.knobPoints);

    const knobPoints = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }].map(point =>
      mult(projectPoint(point, matrix), { x: cols, y: rows })
    );

    for (let i = 0; i < 4; i++) {
      line(displayCtx, knobPoints[i], knobPoints[(i + 1) % 4], 'red');
    }
  }

  let blobDetector = dataToRemember.blobDetector;
  if (!blobDetector || blobDetector.sigma !== config.sigma) {
    if (blobDetector) {
      blobDetector.dispose();
    }
    blobDetector = simpleBlobDetector(config.sigma, videoInput);
  }

  let keyPoints = blobDetector.detectBlobs();

  // Sort by x position. We rely on this when scanning through the circles
  // to find connected components, and when calibrating.
  keyPoints = sortBy(keyPoints, keyPoint => keyPoint.pt.x);

  // Build connected components by scanning through the `keyPoints`, which
  // are sorted by x-position.
  const neighborIndexes = [];
  for (let i = 0; i < keyPoints.length; i++) {
    neighborIndexes[i] = neighborIndexes[i] || [];
    for (let j = i + 1; j < keyPoints.length; j++) {
      neighborIndexes[j] = neighborIndexes[j] || [];

      // Break early if we are too far on the right anyway.
      if (keyPoints[j].pt.x - keyPoints[i].pt.x > keyPoints[i].size * 3) break;

      if (
        norm(diff(keyPoints[i].pt, keyPoints[j].pt)) <
        (keyPoints[i].size + keyPoints[j].size) * 0.9
      ) {
        neighborIndexes[i].push(j);
        neighborIndexes[j].push(i);

        if (displayCtx && config.showOverlayComponentLines) {
          // Draw lines between components.
          line(displayCtx, keyPoints[i], keyPoints[j], 'white');
        }
      }
    }
  }

  // Find acyclical shapes of 7, and put ids into `newDataToRemember`.
  const seenIndexes = new window.Set();
  const keyPointSizes = [];
  const pointsById = {};
  const directionVectorsById = {};
  for (let i = 0; i < keyPoints.length; i++) {
    if (neighborIndexes[i].length == 1 && !seenIndexes.has(i)) {
      const shape = [i]; // Initialise with the first index, then run findShape with 7-1.
      if (findShape(shape, neighborIndexes, 7 - 1)) {
        shape.forEach(index => seenIndexes.add(index));

        // Reverse the array if it's the wrong way around.
        const mag = cross(
          diff(keyPoints[shape[0]].pt, keyPoints[shape[3]].pt),
          diff(keyPoints[shape[6]].pt, keyPoints[shape[3]].pt)
        );
        if (mag > 100) {
          // Use 100 to avoid straight line. We already depend on sorting by x for that.
          shape.reverse();
        }

        const colorIndexes = colorIndexesForShape(shape, keyPoints, config.colorsRGB);
        const id = shapeToId(colorIndexes);
        const cornerNum = shapeToCornerNum(colorIndexes);

        if (cornerNum > -1) {
          // Store the colorIndexes so we can render them later for debugging.
          colorIndexes.forEach((colorIndex, shapePointIndex) => {
            keyPoints[shape[shapePointIndex]].colorIndex = colorIndex;
          });

          pointsById[id] = pointsById[id] || [];
          pointsById[id][cornerNum] = keyPoints[shape[3]].pt;
          directionVectorsById[id] = directionVectorsById[id] || [];
          directionVectorsById[id][cornerNum] = diff(
            keyPoints[shape[6]].pt,
            keyPoints[shape[3]].pt
          );

          shape.forEach(index => keyPointSizes.push(keyPoints[index].size));

          if (displayCtx && config.showOverlayShapeId) {
            // Draw id and corner name.
            const pt = div(add(keyPoints[shape[0]].pt, keyPoints[shape[6]].pt), { x: 2, y: 2 });
            displayCtx.fillStyle = 'blue';
            displayCtx.fillText(`${id},${cornerNames[cornerNum]}`, pt.x, pt.y);
          }
        }
      }
    }
  }
  const avgKeyPointSize =
    keyPointSizes.reduce((sum, value) => sum + value, 0) / keyPointSizes.length;

  keyPoints.forEach(keyPoint => {
    // Give each `keyPoint` a `colorIndex`.
    keyPoint.colorIndex =
      keyPoint.colorIndex || colorIndexForColor(keyPoint.color, config.colorsRGB);

    if (displayCtx) {
      if (config.showOverlayKeyPointCircles) {
        // Draw circles around `keyPoints`.
        const color = config.colorsRGB[keyPoint.colorIndex];
        displayCtx.beginPath();
        displayCtx.arc(keyPoint.pt.x, keyPoint.pt.y, keyPoint.size / 2 + 3, 0, 2 * Math.PI);
        displayCtx.strokeStyle = 'white'; // TODO: use color
        displayCtx.fill();
        displayCtx.stroke();
      }

      if (config.showOverlayKeyPointText) {
        // Draw text inside circles.
        const pt = add(keyPoint.pt, { x: -6, y: 6 });
        displayCtx.fillStyle = 'white';
        displayCtx.fillText(colorNames[keyPoint.colorIndex], pt.x, pt.y);
      }
    }
  });

  const programsToRender = [];
  const vectorsBetweenCorners = { ...(dataToRemember.vectorsBetweenCorners || {}) };
  Object.keys(pointsById).forEach(id => {
    const points = pointsById[id];
    const potentialPoints = [];
    vectorsBetweenCorners[id] = vectorsBetweenCorners[id] || {};
    const dirVecs = directionVectorsById[id];

    // Store/update the angles and magnitudes between known points.
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (i !== j && points[i] && points[j]) {
          const diffVec = diff(points[j], points[i]);
          vectorsBetweenCorners[id][`${i}->${j}`] = {
            angle: Math.atan2(diffVec.y, diffVec.x) - Math.atan2(dirVecs[i].y, dirVecs[i].x),
            magnitude: norm(diffVec),
            // Once we see two corners for real, mark them as not mirrored, so
            // we won't override this when mirroring angles/magnitudes.
            mirrored: false,
          };
        }
      }
    }

    // Assuming the paper is rectangular, mirror angles/magnitudes.
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const thisSide = `${i}->${j}`;
        const otherSide = `${(i + 2) % 4}->${(j + 2) % 4}`;
        if (
          vectorsBetweenCorners[id][thisSide] &&
          (!vectorsBetweenCorners[id][otherSide] || vectorsBetweenCorners[id][otherSide].mirrored)
        ) {
          vectorsBetweenCorners[id][otherSide] = {
            ...vectorsBetweenCorners[id][thisSide],
            mirrored: true,
          };
        }
      }
    }

    // Find potential point for unknown points if we know the angle+magnitude with
    // another point.
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (points[i] && !points[j] && vectorsBetweenCorners[id][`${i}->${j}`]) {
          const { angle, magnitude } = vectorsBetweenCorners[id][`${i}->${j}`];
          const newAngle = angle + Math.atan2(dirVecs[i].y, dirVecs[i].x);
          potentialPoints[j] = potentialPoints[j] || [];
          potentialPoints[j].push({
            x: points[i].x + magnitude * Math.cos(newAngle),
            y: points[i].y + magnitude * Math.sin(newAngle),
          });
        }
      }
    }

    // Take the average of all potential points for each unknown point.
    for (let i = 0; i < 4; i++) {
      if (potentialPoints[i]) {
        points[i] = { x: 0, y: 0 };
        potentialPoints[i].forEach(vec => {
          points[i].x += vec.x / potentialPoints[i].length;
          points[i].y += vec.y / potentialPoints[i].length;
        });
      }
    }

    if (points[0] && points[1] && points[2] && points[3]) {
      const programToRender = {
        points: shrinkPoints(avgKeyPointSize * 0.75, points).map(point =>
          projectPointToUnitSquare(point, cols, rows, config.knobPoints)
        ),
        number: id,
      };
      programsToRender.push(programToRender);

      if (displayCtx && config.showOverlayProgram) {
        const matrix = forwardProjectionMatrixForPoints(config.knobPoints);
        const reprojectedPoints = programToRender.points.map(point =>
          mult(projectPoint(point, matrix), { x: cols, y: rows })
        );

        line(displayCtx, reprojectedPoints[0], reprojectedPoints[1], 'blue');
        line(displayCtx, reprojectedPoints[2], reprojectedPoints[1], 'blue');
        line(displayCtx, reprojectedPoints[2], reprojectedPoints[3], 'blue');
        line(displayCtx, reprojectedPoints[3], reprojectedPoints[0], 'blue');
        line(
          displayCtx,
          div(add(reprojectedPoints[2], reprojectedPoints[3]), { x: 2, y: 2 }),
          div(add(reprojectedPoints[0], reprojectedPoints[1]), { x: 2, y: 2 }),
          'blue'
        );
      }
    }
  });

  return {
    keyPoints,
    programsToRender,
    dataToRemember: { vectorsBetweenCorners, blobDetector },
    framerate: Math.round(1000 / (Date.now() - startTime)),
  };
}
