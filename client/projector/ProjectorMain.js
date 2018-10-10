import React from 'react';

import { mult, forwardProjectionMatrixForPoints } from '../utils';
import Program from './Program';
import Db from './Db';
import { cameraVideoConstraints } from '../constants';

function projectorSize() {
  const width = document.body.clientWidth;
  const height = document.body.clientHeight;
  return { width, height };
}

export default class ProjectorMain extends React.Component {
  constructor() {
    super();

    this.state = {
      whensByProgram: {},
      claimsByProgram: {},
    };
  }

  componentWillMount() {
    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: cameraVideoConstraints,
      })
      .then(stream => {
        this._videoCapture = new ImageCapture(stream.getVideoTracks()[0]);
      });
  }

  grabCameraImageAndProjectionData = async () => {
    const cameraImage = await this._videoCapture.grabFrame();

    const outputCorners = this.props.knobPoints.map(({ x, y }) => ({
      x: x * cameraImage.width,
      y: y * cameraImage.height,
    }));

    const inputSize = projectorSize();
    const inputCorners = [
      { x: 0, y: 0 },
      { x: inputSize.width - 1, y: 0 },
      { x: inputSize.width - 1, y: inputSize.height - 1 },
      { x: 0, y: inputSize.height - 1 },
    ];

    const a = forwardProjectionMatrixForPoints(outputCorners);
    const b = forwardProjectionMatrixForPoints(inputCorners).adjugate();
    const forwardProjectionData = a.multiply(b).data;
    // TODO(JP): the above might be somewhat expensive to calculate.
    // Probably worth profiling and caching if necessary.

    return { cameraImage, forwardProjectionData };
  };

  render() {
    const { claimsByProgram, whensByProgram } = this.state;
    const { width, height } = projectorSize();
    const multPoint = { x: width, y: height };

    const papers = {};
    const programsToRenderByNumber = {};
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

      programsToRenderByNumber[program.number] = program;
    });

    const markers = this.props.markers.map(data => ({
      ...data,
      position: mult(data.position, multPoint),
    }));

    const db = (window.$DB$ = new Db());

    this.props.programsToRender.forEach(program => {
      const programClaims = claimsByProgram[program.number];

      if (!programClaims) {
        return;
      }

      debugger;


      programClaims.forEach(claim => db.addClaim(claim));
    });

    const matchesCache = {};

    return (
      <div>
        {this.props.programsToRender.map(program => {
          const whens = whensByProgram[program.number];

          const matches = {};

          if (whens) {
            whens.forEach(({ claims, id }) => {
              if (matches[id]) {
                return;
              }

              if (matchesCache[id]) {
                matches[id] = matchesCache[id];
                return;
              }

              matches[id] = db.query(claims);
            });
          }

          return (
            <Program
              key={`${program.number}-${program.currentCodeHash}`}
              programsToRenderByNumber={programsToRenderByNumber}
              markers={markers}
              matches={matches}
              programNumber={program.number}
              grabCameraImageAndProjectionData={this.grabCameraImageAndProjectionData}
              papers={papers}
              width={width}
              height={height}
              paperRatio={this.props.paperRatio}
              onUpdate={data => {
                console.log('update', program.number, data);

                this.setState({
                  claimsByProgram: { [program.number]: data.claims },
                  whensByProgram: { [program.number]: data.whens },
                });
              }}
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
          );
        })}
      </div>
    );
  }
}
