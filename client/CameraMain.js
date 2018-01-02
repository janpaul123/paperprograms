/* global cv */

import React from 'react';

import { colorNames } from './constants';
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
    this.state = { keyPoints: [], videoWidth: 1, videoHeight: 1 };
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

    const { programsToRender, keyPoints, newPointsById, framerate } = detectPrograms({
      config: this.props.config,
      videoCapture: this._videoCapture,
      previousPointsById: this._pointsById,
      displayMat,
    });
    this._pointsById = newPointsById;

    cv.imshow(this._canvas, displayMat);
    displayMat.delete();

    this.setState({ keyPoints });
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
          {this.props.allowSelectingDetectedPoints &&
            this.state.keyPoints.map((point, index) => (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  left: (point.pt.x - point.size / 2) / this.state.videoWidth * width,
                  top: (point.pt.y - point.size / 2) / this.state.videoHeight * height,
                  width: point.size / this.state.videoWidth * width,
                  height: point.size / this.state.videoHeight * height,
                  background: 'rgba(255,255,255,0.5)',
                  borderRadius: 1000,
                  cursor: 'pointer',
                }}
                onClick={() => this.props.onSelectColor(point.avgColor)}
              />
            ))}
        </div>
      </div>
    );
  }
}

export default class CameraMain extends React.Component {
  constructor(props) {
    super(props);
    this.state = { pageWidth: 1, framerate: 0, selectedColorIndex: -1 };
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
            allowSelectingDetectedPoints={this.state.selectedColorIndex !== -1}
            onSelectColor={color => {
              if (this.state.selectedColorIndex === -1) return;

              const colorsRGB = this.props.config.colorsRGB.slice();
              colorsRGB[this.state.selectedColorIndex] = color.map(value => Math.round(value));
              this.props.onConfigChange({ ...this.props.config, colorsRGB });
              this.setState({ selectedColorIndex: -1 });
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
          <div style={{ marginBottom: padding }}>
            framerate <strong>{this.state.framerate}</strong>
          </div>

          <div style={{ marginBottom: padding }}>
            <div style={{ marginBottom: padding / 4 }}>colors</div>
            <div>
              {this.props.config.colorsRGB.map((color, colorIndex) => (
                <div
                  key={colorIndex}
                  style={{
                    display: 'inline-block',
                    width: 20,
                    height: 20,
                    background: `rgb(${color.slice(0, 3).join(',')})`,
                    borderRadius: 20,
                    marginRight: 5,
                    color: 'white',
                    fontSize: 14,
                    textAlign: 'center',
                    lineHeight: '20px',
                    cursor: 'pointer',
                    boxShadow:
                      this.state.selectedColorIndex === colorIndex ? '0 0 0 3px white' : '',
                  }}
                  onClick={() =>
                    this.setState(state => ({
                      selectedColorIndex: state.selectedColorIndex === colorIndex ? -1 : colorIndex,
                    }))
                  }
                >
                  {colorNames[colorIndex]}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
