/* global cv */

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
import { colorNames } from '../constants';
import simpleBlobDetector from './simpleBlobDetector';

const cornerNames = ['TL', 'TR', 'BR', 'BL'];

function keyPointToAvgColor(keyPoint, videoMat) {
  const circleROI = videoMat.roi({
    x: Math.floor(keyPoint.pt.x - keyPoint.size / 2),
    y: Math.floor(keyPoint.pt.y - keyPoint.size / 2),
    width: keyPoint.size,
    height: keyPoint.size,
  });

  const circleMask = cv.Mat.zeros(keyPoint.size, keyPoint.size, cv.CV_8UC1);
  cv.circle(
    circleMask,
    { x: Math.floor(keyPoint.size / 2), y: Math.floor(keyPoint.size / 2) },
    keyPoint.size / 2 - 1,
    [255, 255, 255, 0],
    -1
  );

  const squareMean = cv.mean(circleROI);
  const circleMean = cv.mean(circleROI, circleMask);
  circleROI.delete();
  circleMask.delete();

  // Color and intensity invariance, loosely per
  // https://pdfs.semanticscholar.org/ce4c/69deb83cbbf39487987bd50a5c1d87765ec1.pdf
  const avgColorInvariant = mult(div(circleMean, squareMean), [255, 255, 255, 255]);
  const colorSum = avgColorInvariant[0] + avgColorInvariant[1] + avgColorInvariant[2];

  return [
    avgColorInvariant[0] / colorSum * 255,
    avgColorInvariant[1] / colorSum * 255,
    avgColorInvariant[2] / colorSum * 255,
    255,
  ];
}

function colorIndexForColor(matchColor, colors) {
  const colorToRGB = c => ({ R: Math.round(c[0]), G: Math.round(c[1]), B: Math.round(c[2]) });
  const colorsRGB = colors.map(colorToRGB);
  return colorsRGB.indexOf(colorDiff.closest(colorToRGB(matchColor), colorsRGB));
}

function shapeToId(shape, keyPoints) {
  return (
    125 * keyPoints[shape[0]].colorIndex +
    25 * keyPoints[shape[1]].colorIndex +
    5 * keyPoints[shape[3]].colorIndex +
    keyPoints[shape[4]].colorIndex
  );
}

function shapeToCornerNum(shape, keyPoints) {
  if (keyPoints[shape[2]].colorIndex < 0 || keyPoints[shape[2]].colorIndex > 3) return -1;
  return keyPoints[shape[2]].colorIndex;
}

function knobPointsToROI(knobPoints, videoMat) {
  const clampedKnobPoints = knobPoints.map(point => ({
    x: clamp(point.x, 0, 1),
    y: clamp(point.y, 0, 1),
  }));
  const minX = Math.min(...clampedKnobPoints.map(point => point.x * videoMat.cols));
  const minY = Math.min(...clampedKnobPoints.map(point => point.y * videoMat.rows));
  const maxX = Math.max(...clampedKnobPoints.map(point => point.x * videoMat.cols));
  const maxY = Math.max(...clampedKnobPoints.map(point => point.y * videoMat.rows));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

let projectPointToUnitSquarePreviousKnobPoints;
let projectPointToUnitSquarePreviousMatrix;
function projectPointToUnitSquare(point, videoMat, knobPoints) {
  if (
    !projectPointToUnitSquarePreviousMatrix ||
    projectPointToUnitSquarePreviousKnobPoints !== knobPoints
  ) {
    projectPointToUnitSquarePreviousKnobPoints = knobPoints;
    projectPointToUnitSquarePreviousMatrix = forwardProjectionMatrixForPoints(
      knobPoints
    ).adjugate();
  }
  return projectPoint(
    div(point, { x: videoMat.cols, y: videoMat.rows }),
    projectPointToUnitSquarePreviousMatrix
  );
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

export default function detectPrograms({ config, videoCapture, previousPointsById, displayMat }) {
  const startTime = Date.now();

  const pointsById = { ...previousPointsById };

  const videoMat = new cv.Mat(videoCapture.video.height, videoCapture.video.width, cv.CV_8UC4);
  videoCapture.read(videoMat);

  if (displayMat) {
    videoMat.copyTo(displayMat);
    const matrix = forwardProjectionMatrixForPoints(config.knobPoints);

    const knobPoints = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }].map(point =>
      mult(projectPoint(point, matrix), { x: videoMat.cols, y: videoMat.rows })
    );

    for (let i = 0; i < 4; i++) {
      cv.line(displayMat, knobPoints[i], knobPoints[(i + 1) % 4], [255, 0, 0, 255]);
    }
  }

  const videoROI = knobPointsToROI(config.knobPoints, videoMat);
  const clippedVideoMat = videoMat.roi(videoROI);
  let keyPoints = simpleBlobDetector(clippedVideoMat, {
    filterByCircularity: true,
    minCircularity: 0.9,
    minArea: 25,
    filterByInertia: false,
    faster: true,
  });
  clippedVideoMat.delete();
  keyPoints.forEach(keyPoint => {
    keyPoint.pt.x += videoROI.x;
    keyPoint.pt.y += videoROI.y;
  });

  // Sort by x position. We rely on this when scanning through the circles
  // to find connected components, and when calibrating.
  keyPoints = sortBy(keyPoints, keyPoint => keyPoint.pt.x);

  keyPoints.forEach(keyPoint => {
    // Give each `keyPoint` an `avgColor` and `colorIndex`.
    keyPoint.avgColor = keyPointToAvgColor(keyPoint, videoMat);
    keyPoint.colorIndex = colorIndexForColor(keyPoint.avgColor, config.colorsRGB);

    if (displayMat) {
      if (config.showOverlayKeyPointCircles) {
        // Draw circles around `keyPoints`.
        const color = config.colorsRGB[keyPoint.colorIndex];
        cv.circle(displayMat, keyPoint.pt, keyPoint.size / 2 + 3, color, 2);
      }

      if (config.showOverlayKeyPointText) {
        // Draw text inside circles.
        cv.putText(
          displayMat,
          colorNames[keyPoint.colorIndex],
          add(keyPoint.pt, { x: -6, y: 6 }),
          cv.FONT_HERSHEY_DUPLEX,
          0.6,
          [255, 255, 255, 255]
        );
      }
    }
  });

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

        if (displayMat && config.showOverlayComponentLines) {
          // Draw lines between components.
          cv.line(displayMat, keyPoints[i].pt, keyPoints[j].pt, [255, 255, 255, 255]);
        }
      }
    }
  }

  // Find acyclical shapes of 5, and put ids into `pointsById`.
  const seenIndexes = new window.Set();
  const seenIds = new window.Set();
  const keyPointSizes = [];
  for (let i = 0; i < keyPoints.length; i++) {
    if (neighborIndexes[i].length == 1 && !seenIndexes.has(i)) {
      const shape = [i]; // Initialise with the first index, then run findShape with 5-1.
      if (findShape(shape, neighborIndexes, 5 - 1)) {
        shape.forEach(index => seenIndexes.add(index));

        // Reverse the array if it's the wrong way around.
        const mag = cross(
          diff(keyPoints[shape[0]].pt, keyPoints[shape[2]].pt),
          diff(keyPoints[shape[4]].pt, keyPoints[shape[2]].pt)
        );
        if (mag > 100) {
          // Use 100 to avoid straight line. We already depend on sorting by x for that.
          shape.reverse();
        }

        const id = shapeToId(shape, keyPoints);
        const cornerNum = shapeToCornerNum(shape, keyPoints);

        if (cornerNum > -1) {
          seenIds.add(id);
          pointsById[id] = pointsById[id] || [];
          pointsById[id][cornerNum] = keyPoints[shape[2]].pt;

          shape.forEach(index => keyPointSizes.push(keyPoints[index].size));

          if (displayMat && config.showOverlayShapeId) {
            // Draw id and corner name.
            cv.putText(
              displayMat,
              `${id},${cornerNames[cornerNum]}`,
              div(add(keyPoints[shape[0]].pt, keyPoints[shape[4]].pt), { x: 2, y: 2 }),
              cv.FONT_HERSHEY_DUPLEX,
              0.5,
              [0, 0, 255, 255]
            );
          }
        }
      }
    }
  }
  const avgKeyPointSize =
    keyPointSizes.reduce((sum, value) => sum + value, 0) / keyPointSizes.length;

  const programsToRender = [];
  Object.keys(pointsById).forEach(id => {
    if (!seenIds.has(parseInt(id))) {
      // Delete the points if we haven't seen any corner with this id.
      delete pointsById[id];
    } else {
      const points = pointsById[id];
      if (points[0] && points[1] && points[2] && points[3]) {
        const programToRender = {
          points: shrinkPoints(avgKeyPointSize * 0.75, points).map(point =>
            projectPointToUnitSquare(point, videoMat, config.knobPoints)
          ),
          number: id,
        };
        programsToRender.push(programToRender);

        if (displayMat && config.showOverlayProgram) {
          const matrix = forwardProjectionMatrixForPoints(config.knobPoints);
          const reprojectedPoints = programToRender.points.map(point =>
            mult(projectPoint(point, matrix), { x: videoMat.cols, y: videoMat.rows })
          );

          cv.line(displayMat, reprojectedPoints[0], reprojectedPoints[1], [0, 0, 255, 255]);
          cv.line(displayMat, reprojectedPoints[2], reprojectedPoints[1], [0, 0, 255, 255]);
          cv.line(displayMat, reprojectedPoints[2], reprojectedPoints[3], [0, 0, 255, 255]);
          cv.line(displayMat, reprojectedPoints[3], reprojectedPoints[0], [0, 0, 255, 255]);
          cv.line(
            displayMat,
            div(add(reprojectedPoints[2], reprojectedPoints[3]), { x: 2, y: 2 }),
            div(add(reprojectedPoints[0], reprojectedPoints[1]), { x: 2, y: 2 }),
            [0, 0, 255, 255]
          );
        }
      }
    }
  });

  videoMat.delete();

  return {
    keyPoints,
    programsToRender,
    newPointsById: pointsById,
    framerate: Math.round(1000 / (Date.now() - startTime)),
  };
}
