/* global cv */

import { clamp } from '../utils';

export default function programPicture({ config, videoCapture, programToRender }) {
  const videoMat = new cv.Mat(videoCapture.video.height, videoCapture.video.width, cv.CV_8UC4);
  videoCapture.read(videoMat);

  const videoROI = pointsToROI(config.knobPoints, videoMat);
  const clippedVideoMat = videoMat.roi(videoROI);
  const paperROI = pointsToROI(programToRender.points, clippedVideoMat);
  const paperVideoMat = clippedVideoMat.roi(paperROI);

  const rgbaPaperVideoMat = new cv.Mat(paperVideoMat.rows, paperVideoMat.cols, cv.CV_8UC4);
  cv.cvtColor(paperVideoMat, rgbaPaperVideoMat, cv.COLOR_RGB2RGBA);

  const picture = matToStorablePicture(rgbaPaperVideoMat);

  videoMat.delete();
  clippedVideoMat.delete();
  paperVideoMat.delete();
  rgbaPaperVideoMat.delete();

  return picture;
};

function pointsToROI(points, videoMat) {
  const clampedPoints = points.map(point => ({
    x: clamp(point.x, 0, 1),
    y: clamp(point.y, 0, 1)
  }));
  const minX = Math.min(...clampedPoints.map(point => point.x * videoMat.cols));
  const minY = Math.min(...clampedPoints.map(point => point.y * videoMat.rows));
  const maxX = Math.max(...clampedPoints.map(point => point.x * videoMat.cols));
  const maxY = Math.max(...clampedPoints.map(point => point.y * videoMat.rows));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

function copyImageDataToArray(mat) {
  let data = [];
  for (let i = 0; i < mat.data.length; i++) {
    data[i] = mat.data[i];
  }

  return data;
};

function matToStorablePicture(mat) {
  return {
    width: mat.cols,
    height: mat.rows,
    data: copyImageDataToArray(mat)
  };
};
