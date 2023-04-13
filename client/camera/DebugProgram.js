import React from 'react';

import { add, rotateAboutXY } from '../utils';
import styles from './DebugProgram.css';

export default class CameraMain extends React.Component {
  constructor( props ) {
    super( props );

    const videoRatio = this.props.videoWidth / this.props.videoHeight;
    const bl = props.program.points[ 3 ];
    const br = props.program.points[ 2 ];
    bl.y *= videoRatio;
    br.y *= videoRatio;

    // It was much easier to draw an axis aligned div as the debugging program, and then apply
    // rotation to it with a css transform. So the program points without any rotation are saved
    // so that we can first draw the debugging program from these positions.
    this.pointsWithoutRotation = this.props.program.points.slice();

    this.state = {
      program: props.program,
      grabbed: false,
      grabbedOffset: { x: 0, y: 0 },
      resizing: false,
      rotating: false,
      rotation: 0 // in radians
    };
  }

  _onMouseEnter = () => {
    this.props.onMouseEnter();
  };

  _onMouseLeave = () => {
    if ( this.state.grabbed ) {return;}
    if ( this.state.resizing ) {return;}
    if ( this.state.rotating ) {return;}

    this.props.onRelease();
  };

  _onMouseDown = event => {
    if ( event.target === this._closeEl ) {
      this.props.remove();
      return;
    }
    const rect = this._el.getBoundingClientRect();
    const x = event.clientX - rect.x;
    const y = event.clientY - rect.y;

    const resizing = event.target === this._handleEl;
    const rotating = event.target === this._rotateEl;
    const grabbed = !resizing && !rotating;

    this.setState( {
      grabbed,
      rotating,
      resizing,
      grabbedOffset: { x, y }
    } );
    document.addEventListener( 'mouseup', this._onMouseUp, false );
    document.addEventListener( 'mousemove', this._onMouseMove, false );
  };

  _onMouseUp = () => {
    this.setState( { grabbed: false, resizing: false, rotating: false } );
    document.removeEventListener( 'mouseup', this._onMouseUp, false );
    document.removeEventListener( 'mousemove', this._onMouseMove, false );
  };

  _onMouseMove = event => {
    const rect = this._el.getBoundingClientRect();

    // dimensions of the video window
    const parentRect = this._el.parentElement.getBoundingClientRect();
    const program = this.state.program;

    if ( this.state.grabbed ) {

      const x = event.clientX - rect.x - this.state.grabbedOffset.x;
      const y = event.clientY - rect.y - this.state.grabbedOffset.y;

      const normx = x / parentRect.width;
      const normy = y / parentRect.height;

      // save points without rotation for rendering
      this.pointsWithoutRotation = this.pointsWithoutRotation.map( point => add( point, { x: normx, y: normy } ) );

      // apply the translation to program points for the model
      program.points = program.points.map( point => add( point, { x: normx, y: normy } ) );
    }

    if ( this.state.resizing ) {
      const tr = this.pointsWithoutRotation[ 1 ];
      const br = this.pointsWithoutRotation[ 2 ];
      const bl = this.pointsWithoutRotation[ 3 ];

      const x = event.clientX - parentRect.x;
      const y = event.clientY - parentRect.y;

      const normx = x / parentRect.width;
      const normy = y / parentRect.height;
      tr.x = normx;
      br.x = normx;
      br.y = normy;
      bl.y = normy;

      // the resized program without any rotation
      program.points = this.pointsWithoutRotation.slice();

      // with new dimensions set, we can apply rotation to them
      program.points = this.getRotatedPoints( program.points, this.state.rotation );
    }

    let angle = this.state.rotation;
    if ( this.state.rotating ) {

      const centerX = rect.x + rect.width / 2;
      const centerY = rect.y + rect.height / 2;

      const x = event.clientX - parentRect.x;
      const y = event.clientY - parentRect.y;

      const dx = x - centerX;
      const dy = y - centerY;

      angle = Math.atan2( dy, dx ) + Math.PI / 2;

      const angleDelta = angle - this.state.rotation;
      program.points = this.getRotatedPoints( program.points, angleDelta );
    }

    this.setState( { program: program, rotation: angle } );
  };

  getRotatedPoints( normalizedPoints, angle ) {
    if ( this._el ) {
      const rect = this._el.getBoundingClientRect();
      const parentRect = this._el.parentElement.getBoundingClientRect();

      const centerX = rect.x + rect.width / 2;
      const centerY = rect.y + rect.height / 2;

      return normalizedPoints.map( point => {
        const pointInParentFrame = { x: point.x * parentRect.width, y: point.y * parentRect.height };
        const rotated = rotateAboutXY( pointInParentFrame, centerX, centerY, angle );

        return {
          x: rotated.x / parentRect.width,
          y: rotated.y / parentRect.height
        };
      } );
    }
    else {
      return normalizedPoints;
    }
  }

  render() {

    // normalized positions, axis aligned
    const tl = this.pointsWithoutRotation[ 0 ];
    const br = this.pointsWithoutRotation[ 2 ];

    const width = br.x - tl.x;
    const height = br.y - tl.y;

    return (
      <div
        ref={el => ( this._el = el )}
        onMouseDown={this._onMouseDown}
        onMouseEnter={this._onMouseEnter}
        onMouseLeave={this._onMouseLeave}
        onDrag={this._onDrag}
        className={styles.program}
        style={{
          position: 'absolute',
          left: `${tl.x * 100}%`,
          top: `${tl.y * 100}%`,
          width: `${width * 100}%`,
          height: `${height * 100}%`,

          // apply rotation after drawing an axis aligned div
          transform: `rotate(${this.state.rotation}rad)`
        }}
      >
        <h3 className={styles.programNumber}>#{this.state.program.number}</h3>
        <p>{this.state.program.programName}</p>

        <div ref={el => ( this._rotateEl = el )} className={styles.rotateHandle}/>
        <div ref={el => ( this._handleEl = el )} className={styles.resizeHandle}/>
        <div ref={el => ( this._closeEl = el )} className={styles.closeButton}/>
      </div>
    );
  }
}