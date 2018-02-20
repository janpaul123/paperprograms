import React from 'react';
import randomColor from 'randomcolor';
import sortBy from 'lodash/sortBy';
import throttle from 'lodash/throttle';
import xhr from 'xhr';

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

const iframeWidth = 400;
const iframeHeight = iframeWidth * 1.5;
const iframeSizeMatrix = forwardProjectionMatrixForPoints([
  { x: 0, y: 0 },
  { x: iframeWidth, y: 0 },
  { x: iframeWidth, y: iframeHeight },
  { x: 0, y: iframeHeight },
]).adjugate();

const maxLogLength = 100;

export default class Program extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showCanvas: false,
      showSupporterCanvas: false,
      iframe: null,
      debugData: { logs: [] },
    };
  }

  componentDidMount() {
    this._worker = new Worker(this.props.program.currentCodeUrl);
    this._worker.onmessage = this._receiveMessage;
    this._worker.onerror = this._receiveError;
    this._updateDebugData();
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
    xhr.put(this.props.program.debugUrl, { json: this.state.debugData }, () => {});
  }, 300);

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
    const { program } = this.props;
    const matrix = forwardProjectionMatrixForPoints(
      program.points.map(point => mult(point, { x: this.props.width, y: this.props.height }))
    ).multiply(iframeSizeMatrix);

    const iframeStyle = {
      position: 'absolute',
      left: 0,
      top: 0,
      width: iframeWidth,
      height: iframeHeight,
      transform: matrixToCssTransform(matrix),
      transformOrigin: '0 0 0',
      zIndex: 1,
    };

    return <iframe key="iframe" src={this.state.iframe.src} style={{ ...iframeStyle }} />;
  }
}