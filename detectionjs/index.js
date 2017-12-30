/* global cv */

import colorDiff from 'color-diff';
import sortBy from 'lodash/sortBy';

function norm(vector) {
  if (vector.x !== undefined) return norm([vector.x, vector.y]);
  return Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
}

function add(v1, v2) {
  if (v1.x !== undefined) return { x: v1.x + v2.x, y: v1.y + v2.y };
  return v1.map((value, index) => value + v2[index]);
}

function diff(v1, v2) {
  if (v1.x !== undefined) return { x: v1.x - v2.x, y: v1.y - v2.y };
  return v1.map((value, index) => value - v2[index]);
}

function div(v, s) {
  if (v.x !== undefined) return { x: v.x / s, y: v.y / s };
  return v.map(value => value / s);
}

function cross(v1, v2) {
  if (v1.x === undefined || v2.x === undefined) throw new Error('Must be points');
  return v1.x * v2.y - v1.y * v2.x;
}

// Port of https://github.com/opencv/opencv/blob/a50a355/modules/features2d/src/blobdetector.cpp
class SimpleBlobDetector {
  constructor(params) {
    this._params = {
      thresholdStep: 10,
      minThreshold: 50,
      maxThreshold: 220,
      minRepeatability: 2,
      minDistBetweenBlobs: 10,

      filterByColor: true,
      blobColor: 0,

      filterByArea: true,
      minArea: 25,
      maxArea: 5000,

      filterByCircularity: false,
      minCircularity: 0.8,
      maxCircularity: 1000000,

      filterByInertia: true,
      //minInertiaRatio: 0.6,
      minInertiaRatio: 0.1,
      maxInertiaRatio: 1000000,

      filterByConvexity: true,
      //minConvexity: 0.8,
      minConvexity: 0.95,
      maxConvexity: 1000000,

      ...params,
    };
  }

  findBlobs(image, binaryImage) {
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(binaryImage, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_NONE);
    hierarchy.delete();

    const centers = [];
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const moms = cv.moments(contour);

      if (moms.m00 == 0.0) continue;
      const center = {
        confidence: 1,
        location: { x: moms.m10 / moms.m00, y: moms.m01 / moms.m00 },
      };

      if (this._params.filterByArea) {
        const area = moms.m00;
        if (area < this._params.minArea || area >= this._params.maxArea) continue;
      }

      if (this._params.filterByCircularity) {
        const area = moms.m00;
        const perimeter = cv.arcLength(contour, true);
        const ratio = 4 * cv.CV_PI * area / (perimeter * perimeter);
        if (ratio < this._params.minCircularity || ratio >= this._params.maxCircularity) continue;
      }

      if (this._params.filterByInertia) {
        const denominator = Math.sqrt(
          Math.pow(2 * moms.mu11, 2) + Math.pow(moms.mu20 - moms.mu02, 2)
        );
        let ratio;
        if (denominator > 0.01) {
          const cosmin = (moms.mu20 - moms.mu02) / denominator;
          const sinmin = 2 * moms.mu11 / denominator;
          const cosmax = -cosmin;
          const sinmax = -sinmin;

          const imin =
            0.5 * (moms.mu20 + moms.mu02) -
            0.5 * (moms.mu20 - moms.mu02) * cosmin -
            moms.mu11 * sinmin;
          const imax =
            0.5 * (moms.mu20 + moms.mu02) -
            0.5 * (moms.mu20 - moms.mu02) * cosmax -
            moms.mu11 * sinmax;
          ratio = imin / imax;
        } else {
          ratio = 1;
        }

        if (ratio < this._params.minInertiaRatio || ratio >= this._params.maxInertiaRatio) continue;

        center.confidence = ratio * ratio;
      }

      if (this._params.filterByConvexity) {
        const hull = new cv.Mat();
        cv.convexHull(contour, hull);
        const area = cv.contourArea(contour);
        const hullArea = cv.contourArea(hull);
        const ratio = area / hullArea;
        hull.delete();
        if (ratio < this._params.minConvexity || ratio >= this._params.maxConvexity) continue;
      }

      if (this._params.filterByColor) {
        if (
          binaryImage.ucharAt(Math.round(center.location.y), Math.round(center.location.x)) !=
          this._params.blobColor
        )
          continue;
      }

      {
        const dists = [];
        for (let pointIdx = 0; pointIdx < contour.size().height; pointIdx++) {
          const pt = contour.intPtr(pointIdx);
          dists.push(norm(diff(center.location, { x: pt[0], y: pt[1] })));
        }
        dists.sort();
        center.radius =
          (dists[Math.floor((dists.length - 1) / 2)] + dists[Math.floor(dists.length / 2)]) / 2;
      }

      centers.push(center);
    }
    contours.delete();
    return centers;
  }

  detect(image) {
    const grayScaleImage = new cv.Mat(image.rows, image.cols, cv.CV_8UC1);
    cv.cvtColor(image, grayScaleImage, cv.COLOR_RGB2GRAY);

    let centers = [];
    for (
      let thresh = this._params.minThreshold;
      thresh < this._params.maxThreshold;
      thresh += this._params.thresholdStep
    ) {
      const binaryImage = new cv.Mat(image.rows, image.cols, cv.CV_8UC1);
      cv.threshold(grayScaleImage, binaryImage, thresh, 255, cv.THRESH_BINARY);
      let curCenters = this.findBlobs(image, binaryImage);
      binaryImage.delete();
      let newCenters = [];

      for (let i = 0; i < curCenters.length; i++) {
        let isNew = true;
        for (let j = 0; j < centers.length; j++) {
          const dist = norm(
            diff(centers[j][Math.floor(centers[j].length / 2)].location, curCenters[i].location)
          );
          isNew =
            dist >= this._params.minDistBetweenBlobs &&
            dist >= centers[j][Math.floor(centers[j].length / 2)].radius &&
            dist >= curCenters[i].radius;
          if (!isNew) {
            centers[j].push(curCenters[i]);

            let k = centers[j].length - 1;
            while (k > 0 && centers[j][k].radius < centers[j][k - 1].radius) {
              centers[j][k] = centers[j][k - 1];
              k--;
            }
            centers[j][k] = curCenters[i];
            break;
          }
        }
        if (isNew) newCenters.push([curCenters[i]]);
      }
      centers = centers.concat(newCenters);
    }

    grayScaleImage.delete();

    const keyPoints = [];
    for (let i = 0; i < centers.length; i++) {
      if (centers[i].length < this._params.minRepeatability) continue;
      const sumPoint = { x: 0, y: 0 };
      let normalizer = 0;
      for (let j = 0; j < centers[i].length; j++) {
        sumPoint.x += centers[i][j].confidence * centers[i][j].location.x;
        sumPoint.y += centers[i][j].confidence * centers[i][j].location.y;
        normalizer += centers[i][j].confidence;
      }
      sumPoint.x *= 1 / normalizer;
      sumPoint.y *= 1 / normalizer;
      keyPoints.push({
        pt: sumPoint,
        size: centers[i][Math.floor(centers[i].length / 2)].radius * 2,
      });
    }

    return keyPoints;
  }
}

class Detection {
  constructor(video) {
    this._processVideo = this._processVideo.bind(this);

    this._config = {
      colorsRGB: [
        [119, 43, 24, 255],
        [155, 108, 35, 255],
        [94, 104, 48, 255],
        [65, 80, 84, 255],
        [92, 36, 42, 255],
      ],
    };

    this._colorNames = ['R', 'O', 'G', 'B', 'P'];
    this._cornerNames = ['TL', 'TR', 'BR', 'BL'];

    this._pointsById = {};

    this._videoCapture = new cv.VideoCapture(video);
    this._processVideo();
  }

  _keyPointToAvgColor(keyPoint, videoMat) {
    const circleROI = videoMat.roi({
      x: keyPoint.pt.x - keyPoint.size / 2,
      y: keyPoint.pt.y - keyPoint.size / 2,
      width: keyPoint.size,
      height: keyPoint.size,
    });

    const circleMask = cv.Mat.zeros(keyPoint.size, keyPoint.size, cv.CV_8UC1);
    cv.circle(
      circleMask,
      { x: keyPoint.size / 2, y: keyPoint.size / 2 },
      keyPoint.size / 2 - 1,
      [255, 255, 255, 0],
      -1
    );

    const mean = cv.mean(circleROI, circleMask);
    circleROI.delete();
    circleMask.delete();

    return mean;
  }

  _colorIndexForColor(matchColor, colors) {
    const colorToRGB = c => ({ R: Math.round(c[0]), G: Math.round(c[1]), B: Math.round(c[2]) });
    const colorsRGB = colors.map(colorToRGB);
    return colorsRGB.indexOf(colorDiff.closest(colorToRGB(matchColor), colorsRGB));
  }

  _shapeToId(shape, keyPoints) {
    return (
      125 * keyPoints[shape[0]].colorIndex +
      25 * keyPoints[shape[1]].colorIndex +
      5 * keyPoints[shape[3]].colorIndex +
      keyPoints[shape[4]].colorIndex
    );
  }

  _shapeToCornerNum(shape, keyPoints) {
    if (keyPoints[shape[2]].colorIndex < 0 || keyPoints[shape[2]].colorIndex > 3) return -1;
    return keyPoints[shape[2]].colorIndex;
  }

  _processVideo() {
    const startTime = Date.now();
    const videoMat = new cv.Mat(
      this._videoCapture.video.height,
      this._videoCapture.video.width,
      cv.CV_8UC4
    );
    this._videoCapture.read(videoMat);
    const displayMat = videoMat.clone();

    this._simpleBlobDetector =
      this._simpleBlobDetector ||
      new SimpleBlobDetector({
        filterByCircularity: true,
        minCircularity: 0.9,
        minArea: 80,
      });

    let keyPoints = this._simpleBlobDetector.detect(videoMat);

    // Sort by x position. We rely on this when scanning through the circles
    // to find connected components, and when calibrating.
    keyPoints = sortBy(keyPoints, keyPoint => keyPoint.pt.x);

    keyPoints.forEach(keyPoint => {
      // Give every `keyPoint` a `colorIndex`.
      keyPoint.colorIndex = this._colorIndexForColor(
        this._keyPointToAvgColor(keyPoint, videoMat),
        this._config.colorsRGB
      );

      // Draw circles around `keyPoints`.
      const color = this._config.colorsRGB[keyPoint.colorIndex];
      cv.circle(displayMat, keyPoint.pt, keyPoint.size / 2 + 3, color, 2);

      // Draw text inside circles.
      cv.putText(
        displayMat,
        this._colorNames[keyPoint.colorIndex],
        add(keyPoint.pt, { x: -6, y: 6 }),
        cv.FONT_HERSHEY_DUPLEX,
        0.6,
        [255, 255, 255, 255]
      );
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

          // Draw lines between components.
          cv.line(displayMat, keyPoints[i].pt, keyPoints[j].pt, [255, 255, 255, 255]);
        }
      }
    }

    // Find acyclical shapes of 5, and put ids into `this._pointsById`.
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

          const id = this._shapeToId(shape, keyPoints);
          const cornerNum = this._shapeToCornerNum(shape, keyPoints);

          if (cornerNum > -1) {
            seenIds.add(id);
            this._pointsById[id] = this._pointsById[id] || [];
            this._pointsById[id][cornerNum] = keyPoints[shape[2]].pt;

            // Draw id and corner name.
            cv.putText(
              displayMat,
              `${id},${this._cornerNames[cornerNum]}`,
              div(add(keyPoints[shape[0]].pt, keyPoints[shape[4]].pt), 2),
              cv.FONT_HERSHEY_DUPLEX,
              0.5,
              [0, 0, 255, 255]
            );
          }
        }
      }
    }

    Object.keys(this._pointsById).forEach(id => {
      if (!seenIds.has(parseInt(id))) {
        // Delete the points if we haven't seen any corner with this id.
        delete this._pointsById[id];
      } else {
        // If all the points are present, draw some lines.
        const points = this._pointsById[id];
        if (points[0] && points[1] && points[2] && points[3]) {
          cv.line(displayMat, points[0], points[1], [0, 0, 255, 255]);
          cv.line(displayMat, points[2], points[1], [0, 0, 255, 255]);
          cv.line(displayMat, points[2], points[3], [0, 0, 255, 255]);
          cv.line(displayMat, points[3], points[0], [0, 0, 255, 255]);
          cv.line(
            displayMat,
            div(add(points[2], points[3]), 2),
            div(add(points[0], points[1]), 2),
            [0, 0, 255, 255]
          );
        }
      }
    });

    cv.imshow('canvasOutput', displayMat);
    videoMat.delete();
    displayMat.delete();

    const framerate = Math.round(1000 / (Date.now() - startTime));
    document.getElementById('framerate').innerText = framerate;
    setTimeout(this._processVideo);
  }
}

cv.onRuntimeInitialized = function() {
  const video = document.getElementById('videoInput'); // video is the id of video tag
  navigator.mediaDevices
    .getUserMedia({
      audio: false,
      video: {
        width: { ideal: 100000 },
        height: { ideal: 100000 },
      },
    })
    .then(function(stream) {
      video.srcObject = stream;
      video.onloadedmetadata = function() {
        video.play();
        video.width = video.videoWidth;
        video.height = video.videoHeight;
        new Detection(video);
      };
    });
};
