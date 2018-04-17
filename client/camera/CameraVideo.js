/* global cv */

import React from 'react';
import * as d3 from 'd3';

import { cornerNames } from '../constants';
import Knob from './Knob';
import detectPrograms from './detectPrograms';
import styles from './CameraVideo.css';

export default class CameraVideo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { keyPoints: [], videoWidth: 1, videoHeight: 1 };
  }

  componentWillMount() {
    const init = () => {
      navigator.mediaDevices
        .getUserMedia({
          audio: false,

          // specifying "ideal" property with high value doesn't work with some webcams in Chrome
          // instead pick maximum from range of resolutions
          // based on: https://stackoverflow.com/questions/27420581/get-maximum-video-resolution-with-getusermedia#answer-27444179
          video: {
            optional: [
              {minWidth: 320},
              {minWidth: 640},
              {minWidth: 1024},
              {minWidth: 1280},
              {minWidth: 1920},
              {minWidth: 2560},
            ]
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
            this._dataToRemember = {};
            this._processVideo();
          };
        });
    };

    if (cv.Mat) init();
    else cv.onRuntimeInitialized = init;
  }

  componentDidMount() {
    this._attachZoomer();
  }

  _attachZoomer = () => {
    const surface = d3.select(this._zoomSurface);

    // create zoom object and update event
    const zoom = d3
      .zoom()
      .scaleExtent([1, 4])
      .on('zoom', () => {
        const { x, y, k } = d3.event.transform;
        this.props.onConfigChange({ ...this.props.config, zoomTransform: { x, y, k } });
      });

    // initialize zoom
    const { x, y, k } = this.props.config.zoomTransform;
    surface.call(zoom.transform, d3.zoomIdentity.translate(x, y).scale(k));

    // attach zoom handler
    surface.call(zoom);
  };

  _processVideo = () => {
    setTimeout(this._processVideo);
    if (this.props.config.freezeDetection) return;

    const displayMat = new cv.Mat(
      this._videoCapture.video.height,
      this._videoCapture.video.width,
      cv.CV_8UC4
    );

    try {
      const { programsToRender, markers, keyPoints, dataToRemember, framerate } = detectPrograms({
        config: this.props.config,
        videoCapture: this._videoCapture,
        dataToRemember: this._dataToRemember,
        displayMat,
      });
      this._dataToRemember = dataToRemember;
      this.setState({ keyPoints });
      this.props.onProcessVideo({ programsToRender, markers, framerate });
    } catch (error) {
      console.log(error); // eslint-disable-line no-console
    }

    cv.imshow(this._canvas, displayMat);
    displayMat.delete();
  };

  render() {
    const width = this.props.width;
    const height = width / this.state.videoWidth * this.state.videoHeight;
    const { x, y, k } = this.props.config.zoomTransform;

    return (
      <div ref={el => (this._el = el)} style={{ width, height, overflow: 'hidden' }}>
        <video id="videoInput" style={{ display: 'none' }} ref={el => (this._videoInput = el)} />
        <div
          style={{
            position: 'relative',
            width,
            height,
          }}
          ref={el => (this._zoomSurface = el)}
        >
          <canvas
            id="canvasOutput"
            style={{
              position: 'absolute',
              transform: `translate(${x}px, ${y}px) scale(${k})`,
              transformOrigin: '0 0',
              width,
              height,
            }}
            ref={el => (this._canvas = el)}
          />
          {[0, 1, 2, 3].map(position => {
            const point = this.props.config.knobPoints[position];
            return (
              <Knob
                key={position}
                label={cornerNames[position]}
                x={point.x * width * k + x}
                y={point.y * height * k + y}
                onChange={newPoint => {
                  const knobPoints = this.props.config.knobPoints.slice();
                  knobPoints[position] = {
                    x: (newPoint.x - x) / k / width,
                    y: (newPoint.y - y) / k / height,
                  };
                  this.props.onConfigChange({ ...this.props.config, knobPoints });
                }}
              />
            );
          })}
          {this.props.allowSelectingDetectedPoints &&
            this.state.keyPoints.map((point, index) => {
              const px = (point.pt.x - point.size / 2) / this.state.videoWidth * width * k + x;
              const py = (point.pt.y - point.size / 2) / this.state.videoHeight * height * k + y;
              return (
                <div
                  key={index}
                  className={styles.keyPoint}
                  style={{
                    transform: `translate(${px}px, ${py}px) scale(${k})`,
                    transformOrigin: '0 0',
                    width: point.size / this.state.videoWidth * width,
                    height: point.size / this.state.videoHeight * height,
                  }}
                  onClick={() => this.props.onSelectColor(point.avgColor)}
                />
              );
            })}
        </div>
      </div>
    );
  }
}
