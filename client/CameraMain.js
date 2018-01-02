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

class CameraVideo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { videoWidth: 1, videoHeight: 1 };
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
            this.setState({ videoWidth: video.width, videoHeight: video.height });
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

    cv.imshow(this._canvas, displayMat);
    displayMat.delete();

    this.props.onProcessVideo({ programsToRender, framerate });

    setTimeout(this._processVideo);
  };

  render() {
    const { width } = this.props;
    const height = width / this.state.videoWidth * this.state.videoHeight;

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
      </div>
    );
  }
}

export default class CameraMain extends React.Component {
  constructor(props) {
    super(props);
    this.state = { pageWidth: 1, framerate: 0 };
  }

  componentDidMount() {
    window.addEventListener('resize', this._updatePageWidth);
    this._updatePageWidth();
  }

  _updatePageWidth = () => {
    this.setState({ pageWidth: document.body.clientWidth });
  };

  render() {
    const padding = 20;
    const sidebarWidth = 300;

    return (
      <div>
        <div style={{ position: 'absolute', left: padding, top: padding }}>
          <CameraVideo
            width={this.state.pageWidth - padding * 3 - sidebarWidth}
            config={this.props.config}
            onConfigChange={this.props.onConfigChange}
            onProcessVideo={({ programsToRender, framerate }) => {
              this.setState({ framerate });
              this.props.onProgramsChange(programsToRender);
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            top: padding,
            right: padding,
            width: sidebarWidth,
            color: 'white',
            font: '20px sans-serif',
            fontWeight: 300,
          }}
        >
          <div>
            framerate <strong>{this.state.framerate}</strong>
          </div>
        </div>
      </div>
    );
  }
}
