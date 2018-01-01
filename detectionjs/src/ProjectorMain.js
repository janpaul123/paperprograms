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

const canvasSize = 100;
const canvasSizeMatrix = forwardProjectionMatrixForPoints([
  { x: 0, y: 0 },
  { x: canvasSize, y: 0 },
  { x: canvasSize, y: canvasSize },
  { x: 0, y: canvasSize },
]).adjugate();

export default class ProjectorMain extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const width = document.body.clientWidth;
    const height = document.body.clientHeight;

    return (
      <div>
        {this.props.programsToRender.map(program => {
          const matrix = forwardProjectionMatrixForPoints(
            program.points.map(point => mult(point, { x: width, y: height }))
          ).multiply(canvasSizeMatrix);

          return (
            <div
              key={program.id}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: canvasSize,
                height: canvasSize,
                transform: matrixToCssTransform(matrix),
                transformOrigin: '0 0',
                background: 'white',
                boxSizing: 'border-box',
                border: '10px solid black',
              }}
            />
          );
        })}
      </div>
    );
  }
}
