/* global cv */

import React from 'react';

import detectPrograms from './detectPrograms';

class Knob extends React.Component {
  onMouseDown = () => {
    const mouseMoveHandler = event => {
      const parentOffset = this._el.offsetParent.getBoundingClientRect();
      this.props.onChange({
        x: event.clientX - parentOffset.left,
        y: event.clientY - parentOffset.top,
      });
    };
    const mouseUpHandler = () => {
      document.body.removeEventListener('mousemove', mouseMoveHandler, true);
      document.body.removeEventListener('mouseup', mouseUpHandler, true);
    };
    document.body.addEventListener('mousemove', mouseMoveHandler, true);
    document.body.addEventListener('mouseup', mouseUpHandler, true);
  };

  render() {
    const size = 10;
    return (
      <div
        style={{
          position: 'absolute',
          left: this.props.x - size / 2,
          top: this.props.y - size / 2,
          width: size,
          height: size,
          boxShadow: '0 0 0 1px red',
          borderRadius: size,
        }}
        onMouseDown={this.onMouseDown}
        ref={el => (this._el = el)}
      />
    );
  }
}

export default class CameraMain extends React.Component {
  constructor(props) {
    super(props);
    this.state = { framerate: 0, cameraOutputHeight: 0 };
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
            this.setState({
              cameraOutputHeight: this.props.config.cameraOutputWidth / video.width * video.height,
            });
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

    const { programsToRender, newPointsById, framerate } = detectPrograms({
      config: this.props.config,
      videoCapture: this._videoCapture,
      previousPointsById: this._pointsById,
      displayMat,
    });
    this._pointsById = newPointsById;

    this.props.onProgramsChange(programsToRender);

    cv.imshow(this._canvas, displayMat);
    displayMat.delete();

    this.setState({ framerate });

    setTimeout(this._processVideo);
  };

  render() {
    const width = this.props.config.cameraOutputWidth;
    const height = this.state.cameraOutputHeight;
    return (
      <div>
        <video id="videoInput" style={{ display: 'none' }} ref={el => (this._videoInput = el)} />
        <div style={{ position: 'relative', width, height }}>
          <canvas id="canvasOutput" style={{ width, height }} ref={el => (this._canvas = el)} />
          {[0, 1, 2, 3].map(position => {
            const point = this.props.config.knobPoints[position];
            return (
              <Knob
                key={position}
                x={point.x * width}
                y={point.y * height}
                onChange={point => {
                  const knobPoints = this.props.config.knobPoints.slice();
                  knobPoints[position] = { x: point.x / width, y: point.y / height };
                  this.props.onConfigChange({ ...this.props.config, knobPoints });
                }}
              />
            );
          })}
        </div>
        <div
          style={{ position: 'absolute', top: 20, left: 20, font: '12px Courier', color: 'white' }}
        >
          {this.state.framerate}
        </div>
      </div>
    );
  }
}
