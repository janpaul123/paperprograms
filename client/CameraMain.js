/* global cv */

import React from 'react';
import xhr from 'xhr';

import { codeToName, codeToPrint, getApiUrl } from './utils';
import { colorNames } from './constants';
import { printCalibrationPage, printPage } from './printPdf';
import detectPrograms from './detectPrograms';
import helloWorld from './helloWorld';
import styles from './CameraMain.css';

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
    return (
      <div
        className={styles.knob}
        style={{ left: this.props.x, top: this.props.y }}
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

export default class CameraMain extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pageWidth: 1,
      framerate: 0,
      selectedColorIndex: -1,
      spaceData: { programs: [] },
      autoPrintedNumbers: [],
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
    xhr.get(this.props.config.spaceUrl, { json: true }, (error, response) => {
      if (error) {
        console.error(error); // eslint-disable-line no-console
      } else {
        this.setState({ spaceData: response.body }, () => {
          if (this.props.config.autoPrintEnabled) this._autoPrint();
        });
      }

      const elapsedTimeMs = Date.now() - beginTimeMs;
      clearTimeout(this._timeout);
      this._timeout = setTimeout(this._pollSpaceUrl, Math.max(0, targetTimeMs - elapsedTimeMs));
    });
  };

  _updatePageWidth = () => {
    this.setState({ pageWidth: document.body.clientWidth });
  };

  _print = program => {
    printPage(program.number, codeToName(program.originalCode), codeToPrint(program.originalCode));
  };

  _printCalibration = () => {
    printCalibrationPage();
  };

  _markPrinted = program => {
    xhr.post(
      getApiUrl(this.state.spaceData.spaceName, `/programs/${program.number}/markPrinted`),
      { json: true },
      (error, response) => {
        if (error) {
          console.error(error); // eslint-disable-line no-console
        } else {
          this.setState({ spaceData: response.body });
        }
      }
    );
  };

  _autoPrint = () => {
    const toPrint = this.state.spaceData.programs.filter(
      program => !program.printed && !this.state.autoPrintedNumbers.includes(program.number)
    );
    if (toPrint.length > 0) {
      this.setState(
        { autoPrintedNumbers: this.state.autoPrintedNumbers.concat([toPrint[0].number]) },
        () => {
          this._print(toPrint[0]);
          this._markPrinted(toPrint[0]);
        }
      );
    }
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
    const padding = parseInt(styles.cameraMainPadding);
    const sidebarWidth = parseInt(styles.cameraMainSidebarWidth);

    return (
      <div>
        <div className={styles.video}>
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
                      program2 => program2.number.toString() === program.number.toString()
                    );
                    if (!programWithData) return;
                    return {
                      ...program,
                      currentCodeUrl: programWithData.currentCodeUrl,
                      currentCodeHash: programWithData.currentCodeHash,
                      debugUrl: programWithData.debugUrl,
                      claimUrl: programWithData.claimUrl,
                      editorInfo: programWithData.editorInfo,
                      codeHasChanged: programWithData.codeHasChanged,
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
        <div className={styles.sidebar}>
          <div className={styles.sidebarSection}>
            space url{' '}
            <input
              value={this.props.config.spaceUrl}
              onChange={event =>
                this.props.onConfigChange({ ...this.props.config, spaceUrl: event.target.value })
              }
            />
          </div>

          <div className={styles.sidebarSection}>
            editor url{' '}
            <strong>
              {new URL(
                `editor.html?${this.state.spaceData.spaceName}`,
                window.location.origin
              ).toString()}
            </strong>
          </div>

          <div className={styles.sidebarSection}>
            framerate <strong>{this.state.framerate}</strong>
          </div>

          <div className={styles.sidebarSection}>
            <div className={styles.sidebarSectionSection}>print queue</div>
            <div>
              {this.state.spaceData.programs.filter(program => !program.printed).map(program => (
                <div
                  key={program.number}
                  className={styles.printQueueItem}
                  onClick={() => this._print(program)}
                >
                  <strong>#{program.number}</strong> {codeToName(program.originalCode)}{' '}
                  <span
                    className={styles.printQueueItemPrinted}
                    onClick={event => {
                      event.stopPropagation();
                      this._markPrinted(program);
                    }}
                  >
                    [done]
                  </span>
                </div>
              ))}
            </div>
            <button onClick={this._printCalibration}>print calibration page</button>{' '}
            <button onClick={this._createHelloWorld}>create hello world program</button>
            <input
              type="checkbox"
              checked={this.props.config.autoPrintEnabled}
              onChange={() =>
                this.props.onConfigChange({
                  ...this.props.config,
                  autoPrintEnabled: !this.props.config.autoPrintEnabled,
                })
              }
            />{' '}
            auto-print (start Chrome with "--kiosk-printing" flag)
          </div>

          <div className={styles.sidebarSection}>
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

          <div className={styles.sidebarSection}>
            <div className={styles.sidebarSectionSection}>colors</div>
            <div>
              {this.props.config.colorsRGB.map((color, colorIndex) => (
                <div
                  key={colorIndex}
                  className={[
                    styles.colorListItem,
                    this.state.selectedColorIndex === colorIndex && styles.colorListItemSelected,
                  ].join(' ')}
                  style={{ background: `rgb(${color.slice(0, 3).join(',')})` }}
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

          <div className={styles.sidebarSection}>
            <div className={styles.sidebarSectionSection}>show overlay</div>

            <div className={styles.sidebarSectionSection}>
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

            <div className={styles.sidebarSectionSection}>
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

            <div className={styles.sidebarSectionSection}>
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

            <div className={styles.sidebarSectionSection}>
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

            <div className={styles.sidebarSectionSection}>
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
