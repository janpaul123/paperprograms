import { cameraVideoConstraints } from '../constants';
import { forwardProjectionMatrixForPoints, projectPoint } from '../utils';
import Matrix from 'node-matrices';

let knobPoints;
let started = false;
let snapshot;

export function updateCameraSnapshot(_knobPoints) {
  knobPoints = _knobPoints;
  
  if (!started) {
    startVideoStream();
    started = true;
  }
  
  if (snapshot) {
    snapshot.updateSnapshot();
  }
  
  return snapshot;
}
  
function startVideoStream() {
  navigator.mediaDevices
    .getUserMedia({
      audio: false,
      video: cameraVideoConstraints,
    })
    .then(stream => {
      const video = document.getElementById('videoInput');
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
        video.width = video.videoWidth;
        video.height = video.videoHeight;
        snapshot = new CameraSnapshot(video);
      };
    });
}

function normalizePoints(points) {
  if (points.topLeft) {
    const { topLeft, topRight, bottomRight, bottomLeft } = points;
    return [topLeft, topRight, bottomRight, bottomLeft];
  }
  return points;
}

class CameraSnapshot {
  constructor(video) {
    this.canvas = fx.canvas();
    this.video = video;
    this.texture = this.canvas.texture(video);
    this.lastFrameTime = Date.now();
  }

  updateSnapshot() {
    this.texture.loadContentsOf(this.video);
  }

  drawOnCanvas(corners, target, targetFps = 3) {
    const now = Date.now();
    const dt = (now - this.lastFrameTime) / 1000;
    const newFrame = dt * targetFps > 1;

    if (newFrame) {
      this.lastFrameTime = now;
      const source = this.sourcePoints(corners);
      const dest = this.destPoints(target);
      this.canvas.draw(this.texture).perspective(source, dest).update();
    }
      
    target.getContext('2d').drawImage(this.canvas, 0, 0);
  }

  sourcePoints(corners) {
    const forwardProjection = this.grabCameraImageAndProjectionData();
    return normalizePoints(corners)
      .map(p => projectPoint(p, forwardProjection))
      .reduce(((acc, curr) => {
        acc.push(curr.x, curr.y);
        return acc
      }), []);
  }

  destPoints(targetCanvas) {
    return [
      0, 0,
      targetCanvas.width - 1, 0,
      targetCanvas.width - 1, targetCanvas.height - 1,
      0, targetCanvas.height - 1,
    ];
  }

  grabCameraImageAndProjectionData() {
    const outputCorners =
      knobPoints
      .map(({ x, y }) => ({
        x: x * this.video.width,
        y: y * this.video.height,
      }));
    const inputCorners = [
      { x: 0, y: 0 },
      { x: document.body.clientWidth - 1, y: 0 },
      { x: document.body.clientWidth - 1, y: document.body.clientHeight - 1 },
      { x: 0, y: document.body.clientHeight - 1 },
    ];
    const a = forwardProjectionMatrixForPoints(outputCorners);
    const b = forwardProjectionMatrixForPoints(inputCorners).adjugate();
    return new Matrix(a.multiply(b).data);
  }
}
