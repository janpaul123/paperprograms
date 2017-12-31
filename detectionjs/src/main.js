/* global cv */

import React from 'react';

import detectPrograms from './detectPrograms';

export default class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = { framerate: 0 };
  }

  componentDidMount() {
    cv.onRuntimeInitialized = () => {
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
            this._videoCapture = new cv.VideoCapture(video);
            this._pointsById = {};
            this._processVideo();
          };
        });
    };
  }

  _processVideo = () => {
    const displayMat = new cv.Mat(
      this._videoCapture.video.height,
      this._videoCapture.video.width,
      cv.CV_8UC4
    );

    const { newPointsById, framerate } = detectPrograms({
      config: this.props.config,
      videoCapture: this._videoCapture,
      previousPointsById: this._pointsById,
      displayMat,
    });
    this._pointsById = newPointsById;

    cv.imshow(this._canvas, displayMat);
    displayMat.delete();

    this.setState({ framerate });

    setTimeout(this._processVideo);
  };

  render() {
    return (
      <div>
        <video id="videoInput" style={{ display: 'none' }} ref={el => (this._videoInput = el)} />
        <canvas id="canvasOutput" style={{ maxWidth: '100%' }} ref={el => (this._canvas = el)} />
        <div
          style={{ position: 'absolute', top: 20, left: 20, font: '12px Courier', color: 'white' }}
        >
          {this.state.framerate}
        </div>
      </div>
    );
  }
}
