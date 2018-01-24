import React from 'react';

import { forwardProjectionMatrixForPoints, mult } from '../utils';
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

const canvasWidth = 100;
const canvasHeight = 150;
const canvasSizeMatrix = forwardProjectionMatrixForPoints([
  { x: 0, y: 0 },
  { x: canvasWidth, y: 0 },
  { x: canvasWidth, y: canvasHeight },
  { x: 0, y: canvasHeight },
]).adjugate();

export default class Program extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showCanvas: false,
      showSupportCanvas: false,
      debugData: { logs: [], errors: [] },
    };
  }

  componentDidMount() {
    this._worker = new Worker(this.props.program.currentCodeUrl);
    this._worker.onmessage = this._receiveMessage;
    this._worker.onerror = this._receiveError;
  }

  componentWillUnmount() {
    this._worker.terminate();
  }

  _receiveMessage = event => {
    const { command, sendData, messageId } = event.data;

    if (command === 'get') {
      if (sendData.name === 'number') {
        this._worker.postMessage({
          messageId,
          receiveData: { object: this.props.program.number.toString() },
        });
      } else if (sendData.name === 'canvas') {
        if (this.state.showCanvas) {
          this._worker.postMessage({ messageId, receiveData: { object: null } });
        } else {
          this._canvasAvailableCallback = canvas => {
            const offscreen = canvas.transferControlToOffscreen();
            this._worker.postMessage({ messageId, receiveData: { object: offscreen } }, [
              offscreen,
            ]);
            delete this._canvasAvailableCallback;
          };
          this.setState({ showCanvas: true });
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
        this._worker.postMessage({ messageId, receiveData: { object: this.props.papers } });
      }
    } else if (command === 'set') {
      if (sendData.name === 'data') {
        this.props.onDataChange(sendData.data, () => {
          this._worker.postMessage({ messageId });
        });
      }
    } else if (command === 'flushLogs') {
      this.setState({ debugData: { ...this.state.debugData, logs: sendData } }, () => {
        this._flushDebugData();
      });
    }
  };

  _receiveError = error => {
    const errorData = {
      message: error.message,
      lineNumber: error.lineno,
      columnNumber: error.colno,
      filename: error.filename,
    };
    if (errorData.filename.match(/\/program\..*/)) errorData.filename = 'program';
    const errors = this.state.debugData.errors.slice(0, 19).concat([errorData]);

    this.setState({ debugData: { ...this.state.debugData, errors } }, () => {
      this._flushDebugData();
    });
  };

  _flushDebugData = () => {
    xhr.put(this.props.program.debugUrl, { json: this.state.debugData }, () => {});
  };

  render() {
    const { program } = this.props;
    const matrix = forwardProjectionMatrixForPoints(
      program.points.map(point => mult(point, { x: this.props.width, y: this.props.height }))
    ).multiply(canvasSizeMatrix);

    const canvasStyle = {
      position: 'absolute',
      left: 0,
      top: 0,
      width: canvasWidth,
      height: canvasHeight,
      transform: matrixToCssTransform(matrix),
      transformOrigin: '0 0 0',
      zIndex: 1,
    };
    const divStyle = { ...canvasStyle, zIndex: 3 };
    if (program.editorInfo.claimed)
      divStyle.boxShadow = `0 0 0 1px ${randomColor({
        seed: program.editorInfo.editorId,
      })} inset`;

    return (
      <div>
        <div
          className={
            !program.editorInfo.claimed && program.codeHasChanged
              ? styles.canvasWithChangedCode
              : ''
          }
          style={divStyle}
        />
        {this.state.showCanvas && (
          <canvas
            key="canvas"
            ref={el => {
              if (el && this._canvasAvailableCallback) {
                this._canvasAvailableCallback(el);
              }
            }}
            width={canvasWidth}
            height={canvasHeight}
            style={canvasStyle}
          />
        )}
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
}