/* global cv */

import React from 'react';

import detectPrograms from './detectPrograms';
import styles from './CameraVideo.css';

import Knob from './Knob';

export default class CameraVideo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { keyPoints: [], videoWidth: 1, videoHeight: 1 };
  }

  componentWillMount() {
    const init = () => {
      navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            width: { ideal: 100000 },
            height: { ideal: 100000 },
          },
        })
        .then(stream => {
          const video = this._videoInput;
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            video.play();
            video.width = video.videoWidth;
            video.height = video.videoHeight;
            this.setState({ videoWidth: video.width, videoHeight: video.height });
            this._videoCapture = new cv.VideoCapture(video);
            this._pointsById = {};
            this._processVideo();
          };
        });
    };

    if (cv.Mat) init();
    else cv.onRuntimeInitialized = init;
  }

  _onMouseDown = mouseDownEvent => {
    const startCanvasX = this.props.config.zoomCanvasX;
    const startCanvasY = this.props.config.zoomCanvasY;
    const startClientX = mouseDownEvent.clientX;
    const startClientY = mouseDownEvent.clientY;

    const mouseMoveHandler = event => {
      this.props.onConfigChange({
        ...this.props.config,
        zoomCanvasX: startCanvasX + event.clientX - startClientX,
        zoomCanvasY: startCanvasY + event.clientY - startClientY,
      });
    };
    const mouseUpHandler = () => {
      document.body.removeEventListener('mousemove', mouseMoveHandler, true);
      document.body.removeEventListener('mouseup', mouseUpHandler, true);
    };
    document.body.addEventListener('mousemove', mouseMoveHandler, true);
    document.body.addEventListener('mouseup', mouseUpHandler, true);
  };

  _processVideo = () => {
    const displayMat = new cv.Mat(
      this._videoCapture.video.height,
      this._videoCapture.video.width,
      cv.CV_8UC4
    );

    try {
      const { programsToRender, keyPoints, newPointsById, framerate } = detectPrograms({
        config: this.props.config,
        videoCapture: this._videoCapture,
        previousPointsById: this._pointsById,
        displayMat,
      });
      this._pointsById = newPointsById;
      this.setState({ keyPoints });
      this.props.onProcessVideo({ programsToRender: programsToRender, framerate });
    } catch (error) {
      console.log(error); // eslint-disable-line no-console
    }

    cv.imshow(this._canvas, displayMat);
    displayMat.delete();

    setTimeout(this._processVideo);
  };

  render() {
    const width = this.props.width * this.props.zoom;
    const height = width / this.state.videoWidth * this.state.videoHeight;
    const outerWidth = this.props.width;
    const outerHeight = this.props.width / this.state.videoWidth * this.state.videoHeight;

    return (
      <div
        ref={el => (this._el = el)}
        style={{ width: outerWidth, height: outerHeight, overflow: 'hidden' }}
      >
        <video id="videoInput" style={{ display: 'none' }} ref={el => (this._videoInput = el)} />
        <div
          style={{
            position: 'relative',
            width,
            height,
            left: this.props.config.zoomCanvasX,
            top: this.props.config.zoomCanvasY,
          }}
        >
          <canvas
            id="canvasOutput"
            style={{ width, height }}
            ref={el => (this._canvas = el)}
            onMouseDown={this._onMouseDown}
          />
          {[0, 1, 2, 3].map(position => {
            const point = this.props.config.knobPoints[position];
            return (
              <Knob
                key={position}
                label={["BR", "BL", "TL", "TR"][position]}
                x={point.x * width}
                y={point.y * height}
                onChange={newPoint => {
                  const knobPoints = this.props.config.knobPoints.slice();
                  knobPoints[position] = { x: newPoint.x / width, y: newPoint.y / height };
                  this.props.onConfigChange({ ...this.props.config, knobPoints });
                }}
              />
            );
          })}
          {this.props.allowSelectingDetectedPoints &&
            this.state.keyPoints.map((point, index) => (
              <div
                key={index}
                className={styles.keyPoint}
                style={{
                  left: (point.pt.x - point.size / 2) / this.state.videoWidth * width,
                  top: (point.pt.y - point.size / 2) / this.state.videoHeight * height,
                  width: point.size / this.state.videoWidth * width,
                  height: point.size / this.state.videoHeight * height,
                }}
                onClick={() => this.props.onSelectColor(point.avgColor)}
              />
            ))}
        </div>
      </div>
    );
  }
}
