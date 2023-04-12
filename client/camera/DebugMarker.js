/**
 * View component for a debug marker, to test marker code without physical paper.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import React from 'react';
import CloseButton from 'react-bootstrap/CloseButton';
import { add, colorDataToCSS } from '../utils.js';

export default class DebugMarker extends React.Component {
  constructor( props ) {
    super( props );

    this.state = {
      marker: props.marker
    };

    this.grabbedOffset = { x: 0, y: 0 };
    this.grabbed = false;
  }

  /**
   * Begins the drag event.
   */
  _onMouseDown = event => {
    const rect = this._element.getBoundingClientRect();
    const x = event.clientX - rect.x;
    const y = event.clientY - rect.y;
    this.grabbedOffset = { x, y };

    this.grabbed = true;

    document.addEventListener( 'mouseup', this._onMouseUp, false );
    document.addEventListener( 'mousemove', this._onMouseMove, false );
  };

  /**
   * Ends the drag event.
   */
  _onMouseUp = event => {
    this.grabbed = false;
    document.removeEventListener( 'mouseup', this._onMouseUp, false );
    document.removeEventListener( 'mousemove', this._onMouseMove, false );
  };

  /**
   * Handles the drag event every move, if we are grabbed.
   */
  _onMouseMove = event => {
    if ( this.grabbed ) {

      const rect = this._element.getBoundingClientRect();
      const parentRect = this._element.parentElement.getBoundingClientRect();

      const marker = this.state.marker;
      const x = event.clientX - rect.x - this.grabbedOffset.x;
      const y = event.clientY - rect.y - this.grabbedOffset.y;

      const normx = x / parentRect.width;
      const normy = y / parentRect.height;
      marker.position = add( marker.position, { x: normx, y: normy } );

      // Trigger an render right away so there isn't jitter if the next mouse move
      // happens before the marker position is updated.
      this.setState( { marker } );
    }
  };

  render() {
    const videoRatio = this.props.videoWidth / this.props.videoHeight;

    // normalized in the video dimensions
    const center = this.state.marker.position;
    return (
      <div
        ref={element => { this._element = element; }}
        onMouseDown={this._onMouseDown}
        style={{
          position: 'absolute',
          left: `${center.x * 100}%`,
          top: `${center.y * 100}%`,
          width: `${5}%`,
          height: `${5 * videoRatio}%`,

          // useful for debugging
          // backgroundColor: 'rgba(0,100,200,0.5)',

          // positioned relative to left top, this puts marker position at center of div
          transform: 'translate(-50%, -50%)',

          // so that the SVG is centered within
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <CloseButton
          onClick={this.props.remove}
          style={{
            position: 'absolute',
            left: '100%',
            top: '-25%'
          }}
        />
        <svg viewBox='-50 -50 100 100'>
          <circle
            r='50%'
            fill={colorDataToCSS( this.state.marker.color )}
          />
        </svg>
      </div>
    );
  }
}