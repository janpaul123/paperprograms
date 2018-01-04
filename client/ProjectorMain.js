import React from 'react';

import { forwardProjectionMatrixForPoints, mult } from './utils';

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

class Program extends React.Component {
  constructor(props) {
    super(props);
    this.state = { showCanvas: false, showSupportCanvas: false };
  }

  componentDidMount() {
    this._worker = new Worker(this.props.program.currentCodeUrl);
    this._worker.onmessage = this._receiveMessage;
  }

  componentWillUnmount() {
    this._worker.terminate();
  }

  _receiveMessage = event => {
    const { command, sendData, messageId } = event.data;

    if (command === 'get') {
      if (sendData.name === 'number') {
        this._worker.postMessage({ messageId, receiveData: { object: this.props.program.number } });
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
      }
    }
  };

  render() {
    const width = document.body.clientWidth;
    const height = document.body.clientHeight;
    const { program } = this.props;
    const matrix = forwardProjectionMatrixForPoints(
      program.points.map(point => mult(point, { x: width, y: height }))
    ).multiply(canvasSizeMatrix);

    return (
      <div>
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
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: canvasWidth,
              height: canvasHeight,
              transform: matrixToCssTransform(matrix),
              transformOrigin: '0 0 0',
              boxSizing: 'border-box',
              border: '10px solid black',
            }}
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
            width={width}
            height={height}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: width,
              height: height,
            }}
          />
        )}
      </div>
    );
  }
}

export default class ProjectorMain extends React.Component {
  componentDidMount() {
    this._papersBroadcastChannel = new BroadcastChannel('papers');
  }

  componentWillUnmount() {
    this._papersBroadcastChannel.close();
  }

  componentDidUpdate() {
    this._papersBroadcastChannel.postMessage(this.props.programsToRender);
  }

  render() {
    return (
      <div>
        {this.props.programsToRender.map(program => (
          <Program key={`${program.number}-${program.currentCodeHash}`} program={program} />
        ))}
      </div>
    );
  }
}
