import React from 'react';
import randomColor from 'randomcolor';
import sortBy from 'lodash/sortBy';
import throttle from 'lodash/throttle';
import xhr from 'xhr';

import {
  forwardProjectionMatrixForPoints,
  mult,
  filterPapers
} from '../utils';
import styles from './Program.css';

function matrixToCssTransform(matrix) {
  /* eslint-disable prettier/prettier */
  const values = [
    matrix.get(0, 0), matrix.get(1, 0), 0, matrix.get(2, 0),
    matrix.get(0, 1), matrix.get(1, 1), 0, matrix.get(2, 1),
    0, 0, 1, 0,
    matrix.get(0, 2), matrix.get(1, 2), 0, matrix.get(2, 2),
  ];
  /* eslint-enable prettier/prettier */
  return `matrix3d(${values.join(',')})`;
}

const canvasSizeMatrixes = [];
function getCanvasSizeMatrix(width, height) {
  const key = `${width},${height}`;
  canvasSizeMatrixes[key] =
    canvasSizeMatrixes[key] ||
    forwardProjectionMatrixForPoints([
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ]).adjugate();
  return canvasSizeMatrixes[key];
}

const paperRatio = 1.3; // US Letter
const defaultCanvasWidth = 100;
const defaultCanvasHeight = defaultCanvasWidth * paperRatio;
const iframeWidth = 400;
const iframeHeight = iframeWidth * paperRatio;

const maxLogLength = 100;

export default class Program extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      canvasSizeByProgramNumber: {},
      showSupporterCanvas: false,
      iframe: null,
      debugData: { logs: [] },
    };
  }

  componentDidMount() {
    this._worker = new Worker(this._program().currentCodeUrl);
    this._worker.onmessage = this._receiveMessage;
    this._worker.onerror = this._receiveError;
    this._updateDebugData();
  }

  componentWillUnmount() {
    this._worker.terminate();
  }

  _program = () => {
    return this.props.programsToRenderByNumber[this.props.programNumber];
  };

  _receiveMessage = event => {
    const { command, sendData, messageId } = event.data;

    if (command === 'get') {
      if (sendData.name === 'number') {
        this._worker.postMessage({
          messageId,
          receiveData: { object: this._program().number.toString() },
        });
      } else if (sendData.name === 'canvas') {
        const programNumber = sendData.data.number || this._program().number;

        if (this.state.canvasSizeByProgramNumber[programNumber]) {
          this._worker.postMessage({ messageId, receiveData: { object: null } });
        } else {
          this[`_canvasAvailableCallback${programNumber}`] = canvas => {
            const offscreen = canvas.transferControlToOffscreen();
            this._worker.postMessage({ messageId, receiveData: { object: offscreen } }, [
              offscreen,
            ]);
            delete this[`_canvasAvailableCallback${programNumber}`];
          };
          this.setState({
            canvasSizeByProgramNumber: {
              ...this.state.canvasSizeByProgramNumber,
              [programNumber]: {
                width: sendData.data.width || defaultCanvasWidth,
                height:
                  sendData.data.height ||
                  (sendData.data.width ? sendData.data.width * paperRatio : defaultCanvasHeight),
              },
            },
          });
        }
      } else if (sendData.name === 'supporterCanvas') {
        if (this.state.showSupporterCanvas) {
          this._worker.postMessage({ messageId, receiveData: { object: null } });
        } else {
          this._supporterCanvasAvailableCallback = canvas => {
            const offscreen = canvas.transferControlToOffscreen();
            this._worker.postMessage({ messageId, receiveData: { object: offscreen } }, [
              offscreen,
            ]);
            delete this._supporterCanvasAvailableCallback;
          };
          this.setState({ showSupporterCanvas: true });
        }
      } else if (sendData.name === 'papers') {
        const filteredPapers = filterPapers(sendData.data, this._program().number, this.props.papers);
        this._worker.postMessage({ messageId, receiveData: { object: filteredPapers } });
      }
    } else if (command === 'set') {
      if (sendData.name === 'data') {
        this.props.onDataChange(sendData.data, () => {
          this._worker.postMessage({ messageId });
        });
      } else if (sendData.name === 'iframe') {
        this.setState({ iframe: sendData.data });
      }
    } else if (command === 'flushLogs') {
      this._addLogs(sendData);
    }
  };

  _receiveError = error => {
    const logData = {
      name: 'Error',
      args: [error.message],
      lineNumber: error.lineno,
      columnNumber: error.colno,
      filename: error.filename,
      timestamp: Date.now(),
    };
    if (logData.filename.match(/\/program\..*/)) logData.filename = 'program';
    this._addLogs([logData]);
  };

  _addLogs = newLogs => {
    const logs = sortBy(this.state.debugData.logs.concat(newLogs), 'timestamp').slice(
      -maxLogLength
    );
    this.setState({ debugData: { ...this.state.debugData, logs } }, () => {
      this._updateDebugData();
    });
  };

  _updateDebugData = throttle(() => {
    xhr.put(this._program().debugUrl, { json: this.state.debugData }, () => {});
  }, 300);

  _getCssTransform = (program, width, height) => {
    return matrixToCssTransform(
      forwardProjectionMatrixForPoints(
        program.points.map(point => mult(point, { x: this.props.width, y: this.props.height }))
      ).multiply(getCanvasSizeMatrix(width, height))
    );
  };

  render() {
    const program = this._program();

    return (
      <div>
        <div
          className={
            !program.editorInfo.claimed && program.codeHasChanged
              ? styles.canvasWithChangedCode
              : ''
          }
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 200,
            height: 200,
            transform: this._getCssTransform(this._program(), 200, 200),
            transformOrigin: '0 0 0',
            zIndex: 3,
            boxShadow: program.editorInfo.claimed
              ? `0 0 0 1px ${randomColor({
                  seed: program.editorInfo.editorId,
                })} inset`
              : '',
          }}
        />
        {Object.keys(this.state.canvasSizeByProgramNumber).map(programNumberString => {
          const { width, height } = this.state.canvasSizeByProgramNumber[programNumberString];
          const programNumber = parseInt(programNumberString, 10);

          return (
            <canvas
              key="canvas"
              ref={el => {
                if (el && this[`_canvasAvailableCallback${programNumber}`]) {
                  this[`_canvasAvailableCallback${programNumber}`](el);
                }
              }}
              width={width}
              height={height}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width,
                height,
                transform: this._getCssTransform(
                  this.props.programsToRenderByNumber[programNumber],
                  width,
                  height
                ),
                transformOrigin: '0 0 0',
                zIndex: programNumber == program.number ? 1 : 2,
              }}
            />
          );
        })}
        {this.state.iframe && this.renderIframe()}
        {this.state.showSupporterCanvas && (
          <canvas
            key="supporterCanvas"
            ref={el => {
              if (el && this._supporterCanvasAvailableCallback) {
                this._supporterCanvasAvailableCallback(el);
              }
            }}
            width={this.props.width}
            height={this.props.height}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: this.props.width,
              height: this.props.height,
              zIndex: 2,
            }}
          />
        )}
      </div>
    );
  }

  renderIframe() {
    const iframeStyle = {
      position: 'absolute',
      left: 0,
      top: 0,
      width: iframeWidth,
      height: iframeHeight,
      transform: this._getCssTransform(this._program(), iframeWidth, iframeHeight),
      transformOrigin: '0 0 0',
      zIndex: 1,
    };

    return <iframe key="iframe" src={this.state.iframe.src} style={{ ...iframeStyle }} />;
  }
}
