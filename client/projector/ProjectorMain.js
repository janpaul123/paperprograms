import React from 'react';

import { mult } from '../utils';
import Program from './Program';

export default class ProjectorMain extends React.Component {
  render() {
    const width = document.body.clientWidth;
    const height = document.body.clientHeight;
    const multPoint = { x: width, y: height };

    const papers = {};
    this.props.programsToRender.forEach(program => {
      const centerPoint = { x: 0, y: 0 };
      program.points.forEach(point => {
        centerPoint.x += point.x / 4;
        centerPoint.y += point.y / 4;
      });

      papers[program.number] = {
        points: {
          topLeft: mult(program.points[0], multPoint),
          topRight: mult(program.points[1], multPoint),
          bottomRight: mult(program.points[2], multPoint),
          bottomLeft: mult(program.points[3], multPoint),
          center: mult(centerPoint, multPoint),
        },
        data: this.props.dataByProgramNumber[program.number] || {},
      };
    });

    return (
      <div>
        {this.props.programsToRender.map(program => (
          <Program
            key={`${program.number}-${program.currentCodeHash}`}
            program={program}
            papers={papers}
            width={width}
            height={height}
            onDataChange={(data, callback) => {
              this.props.onDataByProgramNumberChange(
                {
                  ...this.props.dataByProgramNumber,
                  [program.number]: {
                    ...this.props.dataByProgramNumber[program.number],
                    ...data,
                  },
                },
                callback
              );
            }}
          />
        ))}
      </div>
    );
  }
}
