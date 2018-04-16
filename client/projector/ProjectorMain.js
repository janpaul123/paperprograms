import React from 'react';

import { mult, forwardProjectionMatrixForPoints } from '../utils';
import Program from './Program';
import { cameraVideoConstraints } from '../constants';

function projectorSize() {
  const width = document.body.clientWidth;
  const height = document.body.clientHeight;
  return { width, height };
}

export default class ProjectorMain extends React.Component {
  componentWillMount() {
    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: cameraVideoConstraints,
      })
      .then(stream => {
        const video = this._videoInput;
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
          video.width = video.videoWidth;
          video.height = video.videoHeight;
          this._videoCanvas = document.createElement('canvas');
          this._videoCanvas.width = video.width;
          this._videoCanvas.height = video.height;
        };
      });
  }
  grabCameraImageAndProjectionData = () => {
    const video = this._videoInput;
    const ctx = this._videoCanvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const cameraImageData = ctx.getImageData(0, 0, video.width, video.height);

    const outputCorners = this.props.knobPoints.map(({ x, y }) => ({
      x: x * video.width,
      y: y * video.height,
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

    return { cameraImageData, forwardProjectionData };
  };
  render() {
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

    const markers = this.props.markers.map(data => {
      const { position, size, color, colorName } = data;
      const scaledPosition = mult(position, multPoint);
      return { position: scaledPosition, size, color, colorName };
    });

    return (
      <div>
        <video id="videoInput" style={{ display: 'none' }} ref={el => (this._videoInput = el)} />
        {this.props.programsToRender.map(program => (
          <Program
            key={`${program.number}-${program.currentCodeHash}`}
            programsToRenderByNumber={programsToRenderByNumber}
            markers={markers}
            programNumber={program.number}
            grabCameraImageAndProjectionData={this.grabCameraImageAndProjectionData}
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
