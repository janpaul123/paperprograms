/* global cv */

import colorDiff from 'color-diff';
import sortBy from 'lodash/sortBy';
import partition from 'lodash/partition';

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

function keyPointToAvgColor(keyPoint, videoMat) {
  const x = Math.floor(keyPoint.pt.x - keyPoint.size / 2);
  const y = Math.floor(keyPoint.pt.y - keyPoint.size / 2);

  const circleROI = videoMat.roi({
    x,
    y,
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

  const circleMean = cv.mean(circleROI, circleMask);
  circleROI.delete();
  circleMask.delete();

  // Find the corners of the circle ROI, but just one pixel outside of it to be
  // more sure to capture white pixels.
  const corners = [
    videoMat.ptr(clamp(y - 1, 0, videoMat.rows), clamp(x - 1, 0, videoMat.cols)),
    videoMat.ptr(clamp(y - 1, 0, videoMat.rows), clamp(x + keyPoint.size + 1, 0, videoMat.cols)),
    videoMat.ptr(clamp(y + keyPoint.size + 1, 0, videoMat.rows), clamp(x - 1, 0, videoMat.cols)),
    videoMat.ptr(
      clamp(y + keyPoint.size + 1, 0, videoMat.rows),
      clamp(x + keyPoint.size + 1, 0, videoMat.cols)
    ),
  ];

  const whiteMax = [
    Math.max(corners[0][0], corners[1][0], corners[2][0], corners[3][0]),
    Math.max(corners[0][1], corners[1][1], corners[2][1], corners[3][1]),
    Math.max(corners[0][2], corners[1][2], corners[2][2], corners[3][2]),
    255,
  ];

  // Normalize to the white colour.
  return [
    clamp(circleMean[0] / whiteMax[0] * 255, 0, 255),
    clamp(circleMean[1] / whiteMax[1] * 255, 0, 255),
    clamp(circleMean[2] / whiteMax[2] * 255, 0, 255),
    255,
  ];
}

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

function colorIndexesForShape(shape, keyPoints, videoMat, colorsRGB) {
  const shapeColors = shape.map(
    keyPointIndex => keyPointToAvgColor(keyPoints[keyPointIndex], videoMat),
    colorsRGB
  );

  const closestColors = [];
  const remainingShapeColors = shapeColors.slice();
  colorsRGB.forEach(mainColor => {
    const closestColorIndex = colorIndexForColor(mainColor, remainingShapeColors);
    closestColors.push(remainingShapeColors[closestColorIndex]);
    remainingShapeColors.splice(closestColorIndex, 1);
  });

  return shapeColors.map(color => colorIndexForColor(color, closestColors));
}

export default function detectPrograms({ config, videoCapture, dataToRemember, displayMat }) {
  const startTime = Date.now();
  const paperDotSizes = config.paperDotSizes;
  const paperDotSizeVariance = // difference min/max size * 2
    Math.max(1, Math.max.apply(null, paperDotSizes) - Math.min.apply(null, paperDotSizes)) * 2;
  const avgPaperDotSize = paperDotSizes.reduce((sum, value) => sum + value) / paperDotSizes.length;

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
  let allPoints = simpleBlobDetector(clippedVideoMat, {
    filterByCircularity: true,
    minCircularity: 0.9,
    minArea: 25,
    filterByInertia: false,
    faster: true,
  });

  clippedVideoMat.delete();
  allPoints.forEach(keyPoint => {
    keyPoint.matchedShape = false; // is true if point has been recognised as part of a shape
    keyPoint.pt.x += videoROI.x;
    keyPoint.pt.y += videoROI.y;

    // Give each `keyPoint` an `avgColor` and `colorIndex`.
    keyPoint.avgColor = keyPointToAvgColor(keyPoint, videoMat);
    keyPoint.colorIndex =
      keyPoint.colorIndex || colorIndexForColor(keyPoint.avgColor, config.colorsRGB);
  });

  let [markers, keyPoints] = partition(
    allPoints,
    ({ size }) => size > avgPaperDotSize + paperDotSizeVariance
  );

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

        if (displayMat && config.showOverlayComponentLines) {
          // Draw lines between components.
          cv.line(displayMat, keyPoints[i].pt, keyPoints[j].pt, [255, 255, 255, 255]);
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

        const colorIndexes = colorIndexesForShape(shape, keyPoints, videoMat, config.colorsRGB);
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

          if (displayMat && config.showOverlayShapeId) {
            // Draw id and corner name.
            cv.putText(
              displayMat,
              `${id},${cornerNames[cornerNum]}`,
              div(add(keyPoints[shape[0]].pt, keyPoints[shape[6]].pt), { x: 2, y: 2 }),
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

  allPoints.forEach(keyPoint => {
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
      const scaledPoints = shrinkPoints(avgKeyPointSize * 0.75, points).map(point =>
        projectPointToUnitSquare(point, videoMat, config.knobPoints)
      );

      const programToRender = {
        points: scaledPoints,
        number: id,
        projectionMatrix: forwardProjectionMatrixForPoints(scaledPoints).adjugate(),
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
  });

  markers = markers.map(({ colorIndex, avgColor, pt, size }) => {
    const markerPosition = projectPointToUnitSquare(pt, videoMat, config.knobPoints);

    const colorName = {
      0: 'red',
      1: 'green',
      2: 'blue',
      3: 'black',
    }[colorIndex];

    // find out on which paper the marker is
    // based on: http://demonstrations.wolfram.com/AnEfficientTestForAPointToBeInAConvexPolygon/
    const matchingProgram = programsToRender.find(({ points }) => {
      for (let i = 0; i < 4; i++) {
        const a = i;
        const b = (i + 1) % 4;

        const sideA = diff(points[a], markerPosition);
        const sideB = diff(points[b], markerPosition);

        let angle = Math.atan2(sideB.y, sideB.x) - Math.atan2(sideA.y, sideA.x);

        if (sideB.y < 0 && sideA.y > 0) {
          angle += 2 * Math.PI;
        }

        if (angle > Math.PI || angle < 0) {
          return false;
        }
      }

      return true;
    });

    return {
      positionOnPaper:
        matchingProgram && projectPoint(markerPosition, matchingProgram.projectionMatrix),
      paperNumber: matchingProgram && matchingProgram.number,
      size,
      position: markerPosition,
      color: avgColor,
      colorName,
    };
  });

  videoMat.delete();

  return {
    keyPoints,
    programsToRender,
    markers,
    dataToRemember: { vectorsBetweenCorners },
    framerate: Math.round(1000 / (Date.now() - startTime)),
  };
}
