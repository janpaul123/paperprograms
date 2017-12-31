/* global cv */

import detectPrograms from './detectPrograms';

const defaultConfig = {
  colorsRGB: [
    [119, 43, 24, 255],
    [155, 108, 35, 255],
    [94, 104, 48, 255],
    [65, 80, 84, 255],
    [92, 36, 42, 255],
  ],
  showOutputCanvas: true,
};

localStorage.dynazarConfig = JSON.stringify({
  ...defaultConfig,
  ...JSON.parse(localStorage.dynazarConfig || '{}'),
});

function processVideo({ videoCapture, previousPointsById }) {
  const config = JSON.parse(localStorage.dynazarConfig);

  const displayMat =
    config.showOutputCanvas &&
    new cv.Mat(videoCapture.video.height, videoCapture.video.width, cv.CV_8UC4);

  const { newPointsById, framerate } = detectPrograms({
    config,
    videoCapture,
    previousPointsById,
    displayMat,
  });

  if (config.showOutputCanvas) {
    cv.imshow('canvasOutput', displayMat);
    displayMat.delete();
  }

  document.getElementById('framerate').innerText = framerate;

  setTimeout(() => processVideo({ videoCapture, previousPointsById: newPointsById }));
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
        processVideo({ videoCapture: new cv.VideoCapture(video), previousPointsById: {} });
      };
    });
};
