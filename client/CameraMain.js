/* global cv */

import React from 'react';
import xhr from 'xhr';

import { codeToName, getApiUrl } from './utils';
import { colorNames } from './constants';
import { printCalibrationPage, printPage } from './printPdf';
import detectPrograms from './detectPrograms';
import helloWorld from './helloWorld';

class Knob extends React.Component {
  _onMouseDown = () => {
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
        onMouseDown={this._onMouseDown}
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
    this.props.onProcessVideo({ programsToRender: programsToRender, framerate });

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
        style={{
          width: outerWidth,
          height: outerHeight,
          overflow: 'hidden',
        }}
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
    this.state = {
      pageWidth: 1,
      framerate: 0,
      selectedColorIndex: -1,
      spaceData: { programs: [] },
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this._updatePageWidth);
    this._updatePageWidth();
    this._pollSpaceUrl();
  }

  _pollSpaceUrl = () => {
    const targetTimeMs = 500;
    const beginTimeMs = Date.now();
    xhr.get(this.props.config.spaceUrl, (error, response) => {
      if (error) {
        console.error(error); // eslint-disable-line no-console
      } else {
        this.setState({ spaceData: JSON.parse(response.body) });
      }

      const elapsedTimeMs = Date.now() - beginTimeMs;
      setTimeout(this._pollSpaceUrl, Math.max(0, targetTimeMs - elapsedTimeMs));
    });
  };

  _updatePageWidth = () => {
    this.setState({ pageWidth: document.body.clientWidth });
  };

  _print = program => {
    printPage(program.number, codeToName(program.originalCode));
  };

  _printCalibration = () => {
    printCalibrationPage();
  };

  _createHelloWorld = () => {
    xhr.post(
      getApiUrl(this.state.spaceData.spaceName, '/programs'),
      { json: { code: helloWorld } },
      error => {
        if (error) {
          console.error(error); // eslint-disable-line no-console
        }
      }
    );
  };

  render() {
    const padding = 20;
    const sidebarWidth = 300;

    return (
      <div>
        <div style={{ position: 'absolute', left: padding, top: padding }}>
          <CameraVideo
            width={this.state.pageWidth - padding * 3 - sidebarWidth}
            zoom={this.props.config.zoom}
            config={this.props.config}
            onConfigChange={this.props.onConfigChange}
            onProcessVideo={({ programsToRender, framerate }) => {
              this.setState({ framerate });
              this.props.onProgramsChange(
                programsToRender
                  .map(program => {
                    const programWithData = this.state.spaceData.programs.find(
                      program2 => program2.number.toString() === program.id.toString()
                    );
                    if (!programWithData) return;
                    return {
                      ...program,
                      originalCode: programWithData.originalCode,
                      currentCode: programWithData.currentCode,
                    };
                  })
                  .filter(Boolean)
              );
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
            space url{' '}
            <input
              value={this.props.config.spaceUrl}
              onChange={event =>
                this.props.onConfigChange({ ...this.props.config, spaceUrl: event.target.value })
              }
            />
          </div>

          <div style={{ marginBottom: padding, wordBreak: 'break-all' }}>
            editor url{' '}
            <strong>
              {new URL(
                `editor.html?${this.state.spaceData.spaceName}`,
                window.location.origin
              ).toString()}
            </strong>
          </div>

          <div style={{ marginBottom: padding }}>
            framerate <strong>{this.state.framerate}</strong>
          </div>

          <div style={{ marginBottom: padding }}>
            <div style={{ marginBottom: padding / 4 }}>print queue</div>
            <div>
              {this.state.spaceData.programs.filter(program => !program.printed).map(program => (
                <div
                  key={program.number}
                  style={{ cursor: 'pointer', marginBottom: padding / 4 }}
                  onClick={() => this._print(program)}
                >
                  <strong>#{program.number}</strong> {codeToName(program.originalCode)}
                </div>
              ))}
            </div>
            <button onClick={this._printCalibration}>print calibration page</button>{' '}
            <button onClick={this._createHelloWorld}>create hello world program</button>
          </div>

          <div style={{ marginBottom: padding }}>
            zoom{' '}
            <input
              type="range"
              min="1"
              max="4"
              step="0.25"
              value={this.props.config.zoom}
              onChange={event =>
                this.props.onConfigChange({ ...this.props.config, zoom: event.target.value })
              }
            />
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
                  <strong>{colorNames[colorIndex]}</strong>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: padding }}>
            <div style={{ marginBottom: padding / 4 }}>show overlay</div>

            <div style={{ marginBottom: padding / 4 }}>
              <input
                type="checkbox"
                checked={this.props.config.showOverlayKeyPointCircles}
                onChange={() =>
                  this.props.onConfigChange({
                    ...this.props.config,
                    showOverlayKeyPointCircles: !this.props.config.showOverlayKeyPointCircles,
                  })
                }
              />{' '}
              keypoint circles
            </div>

            <div style={{ marginBottom: padding / 4 }}>
              <input
                type="checkbox"
                checked={this.props.config.showOverlayKeyPointText}
                onChange={() =>
                  this.props.onConfigChange({
                    ...this.props.config,
                    showOverlayKeyPointText: !this.props.config.showOverlayKeyPointText,
                  })
                }
              />{' '}
              keypoint text
            </div>

            <div style={{ marginBottom: padding / 4 }}>
              <input
                type="checkbox"
                checked={this.props.config.showOverlayComponentLines}
                onChange={() =>
                  this.props.onConfigChange({
                    ...this.props.config,
                    showOverlayComponentLines: !this.props.config.showOverlayComponentLines,
                  })
                }
              />{' '}
              component lines
            </div>

            <div style={{ marginBottom: padding / 4 }}>
              <input
                type="checkbox"
                checked={this.props.config.showOverlayShapeId}
                onChange={() =>
                  this.props.onConfigChange({
                    ...this.props.config,
                    showOverlayShapeId: !this.props.config.showOverlayShapeId,
                  })
                }
              />{' '}
              shape ids
            </div>

            <div style={{ marginBottom: padding / 4 }}>
              <input
                type="checkbox"
                checked={this.props.config.showOverlayProgram}
                onChange={() =>
                  this.props.onConfigChange({
                    ...this.props.config,
                    showOverlayProgram: !this.props.config.showOverlayProgram,
                  })
                }
              />{' '}
              programs
            </div>
          </div>
        </div>
      </div>
    );
  }
}
