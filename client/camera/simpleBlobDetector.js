/* global cv */

import { diff, norm } from '../utils';

// Port of https://github.com/opencv/opencv/blob/a50a355/modules/features2d/src/blobdetector.cpp
// But with special `faster` option which has slightly different semantics,
// but is a whole bunch faster.

const defaultParams = {
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

  faster: false,
  scaleFactor: 4,
};

function findBlobs(binaryImage, params) {
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  if (params.faster) {
    cv.findContours(binaryImage, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
  } else {
    cv.findContours(binaryImage, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_NONE);
  }
  hierarchy.delete();

  const centers = [];
  const objectsToDelete = [];
  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    objectsToDelete.push(contour);
    const area = cv.contourArea(contour);

    if (area == 0) continue;

    let center, moms;
    if (params.faster) {
      const { x, y, width, height } = cv.boundingRect(contour);
      center = {
        confidence: 1,
        location: { x: x + width / 2, y: y + height / 2 },
        radius: (width + height) / 4,
      };
    } else {
      moms = cv.moments(contour);
      center = {
        confidence: 1,
        location: { x: moms.m10 / moms.m00, y: moms.m01 / moms.m00 },
      };
    }

    if (params.filterByArea) {
      if (area < params.minArea || area >= params.maxArea) continue;
    }

    if (params.filterByCircularity) {
      const perimeter = cv.arcLength(contour, true);
      const ratio = 4 * cv.CV_PI * area / (perimeter * perimeter);
      if (ratio < params.minCircularity || ratio >= params.maxCircularity) continue;
    }

    if (params.filterByInertia) {
      if (params.faster) {
        throw new Error('Cannot both set params.faster and params.filterByInertia');
      }

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

      if (ratio < params.minInertiaRatio || ratio >= params.maxInertiaRatio) continue;

      center.confidence = ratio * ratio;
    }

    if (params.filterByConvexity) {
      const hull = new cv.Mat();
      cv.convexHull(contour, hull);
      const hullArea = cv.contourArea(hull);
      const ratio = area / hullArea;
      hull.delete();
      if (ratio < params.minConvexity || ratio >= params.maxConvexity) continue;
    }

    if (params.filterByColor) {
      if (
        binaryImage.ucharAt(Math.round(center.location.y), Math.round(center.location.x)) !=
        params.blobColor
      )
        continue;
    }

    if (!params.faster) {
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
  objectsToDelete.forEach(obj => obj.delete());
  contours.delete();
  return centers;
}

export default function simpleBlobDetector(image, params) {
  params = { ...defaultParams, ...params };

  params.minArea /= params.scaleFactor;
  params.maxArea /= params.scaleFactor;

  const scaledSize = new cv.Size(image.cols / params.scaleFactor, image.rows / params.scaleFactor);
  const scaledImage = new cv.Mat(scaledSize, image.type());
  cv.resize(image, scaledImage, scaledSize, 0, 0, cv.INTER_LINEAR);

  const grayScaleImage = new cv.Mat(scaledSize, cv.CV_8UC1);
  cv.cvtColor(scaledImage, grayScaleImage, cv.COLOR_RGB2GRAY);

  scaledImage.delete();

  let centers = [];
  for (
    let thresh = params.minThreshold;
    thresh < params.maxThreshold;
    thresh += params.thresholdStep
  ) {
    const binaryImage = new cv.Mat(scaledSize, cv.CV_8UC1);
    cv.threshold(grayScaleImage, binaryImage, thresh, 255, cv.THRESH_BINARY);
    let curCenters = findBlobs(binaryImage, params);
    binaryImage.delete();

    let newCenters = [];
    for (let i = 0; i < curCenters.length; i++) {
      curCenters[i].location.x *= params.scaleFactor;
      curCenters[i].location.y *= params.scaleFactor;
      curCenters[i].radius *= params.scaleFactor;

      let isNew = true;
      for (let j = 0; j < centers.length; j++) {
        const dist = norm(
          diff(centers[j][Math.floor(centers[j].length / 2)].location, curCenters[i].location)
        );
        isNew =
          dist >= params.minDistBetweenBlobs &&
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
    if (centers[i].length < params.minRepeatability) continue;
    const sumPoint = { x: 0, y: 0 };
    let normalizer = 0;
    for (let j = 0; j < centers[i].length; j++) {
      sumPoint.x += centers[i][j].confidence * centers[i][j].location.x;
      sumPoint.y += centers[i][j].confidence * centers[i][j].location.y;
      normalizer += centers[i][j].confidence;
    }
    sumPoint.x *= 1 / normalizer;
    sumPoint.y *= 1 / normalizer;
    let size = Math.round(centers[i][Math.floor(centers[i].length / 2)].radius * 2);
    size = Math.min(
      size,
      sumPoint.x * 2,
      sumPoint.y * 2,
      (image.cols - sumPoint.x) * 2,
      (image.rows - sumPoint.y) * 2
    );
    keyPoints.push({ pt: sumPoint, size });
  }

  return keyPoints;
}
