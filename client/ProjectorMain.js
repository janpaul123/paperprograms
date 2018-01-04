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
  componentDidMount() {
    this._worker = new Worker(this.props.program.currentCodeUrl);

    var offscreen = this._canvas.transferControlToOffscreen();
    this._worker.postMessage({ canvas: offscreen }, [offscreen]);
  }

  componentWillUnmount() {
    this._worker.terminate();
  }

  render() {
    const width = document.body.clientWidth;
    const height = document.body.clientHeight;
    const { program } = this.props;
    const matrix = forwardProjectionMatrixForPoints(
      program.points.map(point => mult(point, { x: width, y: height }))
    ).multiply(canvasSizeMatrix);

    return (
      <canvas
        key={program.id}
        ref={el => (this._canvas = el)}
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
    );
  }
}

export default class ProjectorMain extends React.Component {
  render() {
    return (
      <div>
        {this.props.programsToRender.map(program => (
          <Program key={`${program.id}-${program.currentCodeHash}`} program={program} />
        ))}
      </div>
    );
  }
}
