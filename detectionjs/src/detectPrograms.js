/* global cv */

import colorDiff from 'color-diff';
import sortBy from 'lodash/sortBy';

import { add, clip, cross, diff, div, mult, norm } from './utils';
import simpleBlobDetector from './simpleBlobDetector';

const colorNames = ['R', 'O', 'G', 'B', 'P'];
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

  const mean = cv.mean(circleROI, circleMask);
  circleROI.delete();
  circleMask.delete();

  return mean;
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
  const clippedKnobPoints = knobPoints.map(point => ({
    x: clip(point.x, 0, 1),
    y: clip(point.y, 0, 1),
  }));
  const minX = Math.min(...clippedKnobPoints.map(point => point.x * videoMat.cols));
  const minY = Math.min(...clippedKnobPoints.map(point => point.y * videoMat.rows));
  const maxX = Math.max(...clippedKnobPoints.map(point => point.x * videoMat.cols));
  const maxY = Math.max(...clippedKnobPoints.map(point => point.y * videoMat.rows));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export default function detectPrograms({ config, videoCapture, previousPointsById, displayMat }) {
  const startTime = Date.now();

  const pointsById = { ...previousPointsById };

  const videoMat = new cv.Mat(videoCapture.video.height, videoCapture.video.width, cv.CV_8UC4);
  videoCapture.read(videoMat);

  if (displayMat) {
    videoMat.copyTo(displayMat);
    const multiplier = { x: videoMat.cols, y: videoMat.rows };

    for (let i = 0; i < config.knobPoints.length; i++) {
      cv.line(
        displayMat,
        mult(config.knobPoints[i], multiplier),
        mult(config.knobPoints[(i + 1) % config.knobPoints.length], multiplier),
        [255, 0, 0, 255]
      );
    }
  }

  const videoROI = knobPointsToROI(config.knobPoints, videoMat);
  const clippedVideoMat = videoMat.roi(videoROI);
  let keyPoints = simpleBlobDetector(clippedVideoMat, {
    filterByCircularity: true,
    minCircularity: 0.9,
    minArea: 80,
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
    // Give every `keyPoint` a `colorIndex`.
    keyPoint.colorIndex = colorIndexForColor(
      keyPointToAvgColor(keyPoint, videoMat),
      config.colorsRGB
    );

    if (displayMat) {
      // Draw circles around `keyPoints`.
      const color = config.colorsRGB[keyPoint.colorIndex];
      cv.circle(displayMat, keyPoint.pt, keyPoint.size / 2 + 3, color, 2);

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

        if (displayMat) {
          // Draw lines between components.
          cv.line(displayMat, keyPoints[i].pt, keyPoints[j].pt, [255, 255, 255, 255]);
        }
      }
    }
  }

  // Find acyclical shapes of 5, and put ids into `pointsById`.
  const seenIndexes = new window.Set();
  const seenIds = new window.Set();
  for (let i = 0; i < keyPoints.length; i++) {
    if (neighborIndexes[i].length == 1 && !seenIndexes.has(i)) {
      let index = i;
      const shape = [];
      while (index !== undefined) {
        shape.push(index);
        seenIndexes.add(index);
        index = neighborIndexes[index].find(potentialIndex => !seenIndexes.has(potentialIndex));
      }
      if (shape.length == 5) {
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

          if (displayMat) {
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

  const programsToRender = [];
  Object.keys(pointsById).forEach(id => {
    if (!seenIds.has(parseInt(id))) {
      // Delete the points if we haven't seen any corner with this id.
      delete pointsById[id];
    } else {
      const points = pointsById[id];
      if (points[0] && points[1] && points[2] && points[3]) {
        programsToRender.push({ points, id });

        if (displayMat) {
          cv.line(displayMat, points[0], points[1], [0, 0, 255, 255]);
          cv.line(displayMat, points[2], points[1], [0, 0, 255, 255]);
          cv.line(displayMat, points[2], points[3], [0, 0, 255, 255]);
          cv.line(displayMat, points[3], points[0], [0, 0, 255, 255]);
          cv.line(
            displayMat,
            div(add(points[2], points[3]), { x: 2, y: 2 }),
            div(add(points[0], points[1]), { x: 2, y: 2 }),
            [0, 0, 255, 255]
          );
        }
      }
    }
  });

  videoMat.delete();

  return {
    programsToRender,
    newPointsById: pointsById,
    framerate: Math.round(1000 / (Date.now() - startTime)),
  };
}
