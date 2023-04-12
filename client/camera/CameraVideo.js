/* global cv */

import * as d3 from 'd3';
import React from 'react';

import clientConstants from '../clientConstants';
import styles from './CameraVideo.css';
import DebugMarker from './DebugMarker.js';
import DebugProgram from './DebugProgram';
import detectPrograms from './detectPrograms';
import Knob from './Knob';

export default class CameraVideo extends React.Component {
  constructor( props ) {
    super( props );
    this.state = { keyPoints: [], videoWidth: 1, videoHeight: 1 };

    const init = () => {
      navigator.mediaDevices
        .getUserMedia( {
          audio: false,
          video: clientConstants.cameraVideoConstraints
        } )
        .then( stream => {
          const video = this._videoInput;
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            video.play();
            video.width = video.videoWidth;
            video.height = video.videoHeight;
            this.setState( { videoWidth: video.width, videoHeight: video.height } );
            this._videoCapture = new cv.VideoCapture( video );
            this._dataToRemember = {};
            this._processVideo();
          };
        } );
    };

    if ( cv.Mat ) {
      init();
    }
    else {
      cv.onRuntimeInitialized = init;
    }
  }

  componentDidMount() {
    this._attachZoomer();
  }

  _attachZoomer = () => {
    const surface = d3.select( this._zoomSurface );

    // create zoom object and update event
    const zoom = d3
      .zoom()
      .scaleExtent( [ 1, 4 ] )
      .filter( () => {

        // shift key required - it is too easy to change this accidentally and we don't want to transform unless
        // user really wants it. Thanks to https://stackoverflow.com/questions/45189490/d3-change-zoom-and-pan-gestures.
        return d3.event.shiftKey;
      } )
      .on( 'zoom', () => {
        const { x, y, k } = d3.event.transform;
        this.props.onConfigChange( { ...this.props.config, zoomTransform: { x, y, k } } );
      } );

    // initialize zoom
    const { x, y, k } = this.props.config.zoomTransform;
    surface.call( zoom.transform, d3.zoomIdentity.translate( x, y ).scale( k ) );

    // attach zoom handler
    surface.call( zoom );
  };

  _disableZoomer = () => {
    const surface = d3.select( this._zoomSurface );
    surface.on( '.zoom', null );
  };

  _processVideo = () => {
    setTimeout( this._processVideo );
    if ( this.props.config.freezeDetection ) {return;}

    const displayMat = new cv.Mat(
      this._videoCapture.video.height,
      this._videoCapture.video.width,
      cv.CV_8UC4
    );

    try {
      const {
        programsToRender, markers, keyPoints, dataToRemember, framerate
      } = detectPrograms( {
        config: this.props.config,
        videoCapture: this._videoCapture,
        dataToRemember: this._dataToRemember,
        displayMat,
        scaleFactor: this.props.config.scaleFactor,
        allBlobsAreKeyPoints: this.props.allowSelectingDetectedPoints,
        debugPrograms: this.props.debugPrograms,
        debugMarkers: this.props.debugMarkers
      } );
      this._dataToRemember = dataToRemember;
      this.setState( { keyPoints } );
      this.props.onProcessVideo( { programsToRender, markers, framerate } );
    }
    catch( error ) {
      console.log( error );
    }

    cv.imshow( this._canvas, displayMat );
    displayMat.delete();
  };

  render() {
    const width = this.props.width;
    const height = width / this.state.videoWidth * this.state.videoHeight;
    const { x, y, k } = this.props.config.zoomTransform;

    return (
      <div ref={el => ( this._el = el )} style={{ width, height, overflow: 'hidden' }}>
        <video id='videoInput' style={{ display: 'none' }} ref={el => ( this._videoInput = el )}/>
        <div
          style={{
            position: 'relative',
            width,
            height,
            background: 'linen'
          }}
          ref={el => ( this._zoomSurface = el )}
        >
          <canvas
            id='canvasOutput'
            style={{
              position: 'absolute',
              transform: `translate(${x}px, ${y}px) scale(${k})`,
              transformOrigin: '0 0',
              width,
              height
            }}
            ref={el => ( this._canvas = el )}
          />
          <div
            style={{
              position: 'absolute',
              transform: `translate(${x}px, ${y}px) scale(${k})`,
              transformOrigin: '0 0',
              width,
              height
            }}
          >
            {this.props.debugPrograms.map( program => {
              return (
                <DebugProgram
                  key={program.number}
                  program={program}
                  onMouseEnter={() => this._disableZoomer()}
                  onRelease={() => this._attachZoomer()}
                  videoWidth={this.state.videoWidth}
                  videoHeight={this.state.videoHeight}
                  remove={() => this.props.removeDebugProgram( program )}
                />
              );
            } )}
            {this.props.debugMarkers.map( ( marker, index ) => {
              return (
                <DebugMarker
                  key={marker.count}
                  marker={marker}
                  onMouseEnter={() => this._disableZoomer()}
                  onRelease={() => this._attachZoomer()}
                  videoWidth={this.state.videoWidth}
                  videoHeight={this.state.videoHeight}
                  remove={() => {
                    this.props.removeDebugMarker( marker );
                  }}
                ></DebugMarker>
              );
            } )}
          </div>
          {[ 0, 1, 2, 3 ].map( position => {
            const point = this.props.config.knobPoints[ position ];
            return (
              <Knob
                key={position}
                label={clientConstants.cornerNames[ position ]}
                x={point.x * width * k + x}
                y={point.y * height * k + y}
                onChange={newPoint => {
                  const knobPoints = this.props.config.knobPoints.slice();
                  knobPoints[ position ] = {
                    x: ( newPoint.x - x ) / k / width,
                    y: ( newPoint.y - y ) / k / height
                  };
                  this.props.onConfigChange( { ...this.props.config, knobPoints } );
                }}
              />
            );
          } )}
          {this.props.allowSelectingDetectedPoints &&
           this.state.keyPoints.map( ( point, index ) => {
             const px = ( point.pt.x - point.size / 2 ) / this.state.videoWidth * width * k + x;
             const py = ( point.pt.y - point.size / 2 ) / this.state.videoHeight * height * k + y;
             return (
               <div
                 key={index}
                 className={styles.keyPoint}
                 style={{
                   transform: `translate(${px}px, ${py}px) scale(${k})`,
                   transformOrigin: '0 0',
                   width: point.size / this.state.videoWidth * width,
                   height: point.size / this.state.videoHeight * height
                 }}
                 onClick={() => {
                   this.props.onSelectPoint( { color: point.avgColor, size: point.size } );
                 }}
               />
             );
           } )}
        </div>
      </div>
    );
  }
}