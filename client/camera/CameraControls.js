/**
 * CameraControls is a React component that provides a UI and underlying functional code for adjusting parameters of the
 * camera.
 *
 * @author John Blanco (PhET Interactive Simulations)
 */

import React from 'react';
import styles from './CameraMain.css';

class CameraControls extends React.Component {

  constructor( props ) {
    super( props );

    // State information, used for rendering.
    this.state = {
      exposureMode: 'continuous',
      exposureTime: 0
    };

    // {MediaStreamTrack|null} - the video track of the camera that is watching the papers
    this.track = null;
    this.trackCapabilities = null;

    // Get the media stream.
    // TODO: We should probably make the video track part of the state.
    navigator.mediaDevices.getUserMedia( { video: true } )
      .then( mediaStream => {

        // Create a local reference to the video track.
        this.track = mediaStream.getVideoTracks()[ 0 ];

        // Make the track capabilities available to the rending method.
        this.trackCapabilities = this.track.getCapabilities();

        // Set the component state with initial values from the track settings.
        const settings = this.track.getSettings();
        this.state.exposureTime = settings.exposureTime;
        this.state.exposureMode = settings.exposureMode;
      } )
      .catch( e => {
        console.log( `Error getting media track: e = ${e}` );
      } );
  }

  /**
   * Render the component
   * @returns {JSX.Element}
   * @public
   */
  render() {

    // Render a temporary message until the track information is available.
    if ( this.track === null ) {
      return <>
        <p>Awaiting video track info...</p>
      </>;
    }

    return (
      <>
        <h3 className={styles.headerWithOption}>Camera Settings</h3>
        <br/>
        <input
          type='checkbox'
          name='automaticExposure'
          checked={this.state.exposureMode === 'continuous'}
          onChange={event => {
            const automaticExposure = event.target.checked;
            this.setState( { exposureMode: automaticExposure ? 'continuous' : 'manual' } );
            if ( automaticExposure ) {
              console.log( 'Setting camera parameters to continuous mode.' );
              this.track.applyConstraints( { advanced: [ { exposureMode: 'continuous' } ] } );
            }
            else {
              console.log( 'Setting camera parameters to manual mode.' );
              this.track.applyConstraints( { advanced: [ { exposureMode: 'manual' } ] } );
            }
          }}
        />
        <label htmlFor='automaticExposure'>Auto Exposure</label>
        <br/>
        <input
          name='exposure'
          type='range'
          min={this.trackCapabilities.exposureTime.min.toString()}
          max={this.trackCapabilities.exposureTime.max.toString()}
          step={this.trackCapabilities.exposureTime.step.toString()}
          value={this.state.exposureTime}
          onChange={event => {
            const exposureTime = event.target.valueAsNumber;
            console.log( `exposureTime = ${exposureTime}` );
            this.setState( { exposureTime: exposureTime } );
            this.track.applyConstraints( {
              advanced: [ { exposureTime: exposureTime } ]
            } )
              .then( () => { console.log( 'setting of exposure time finished' ); } )
              .catch( e => { console.log( `error setting exposre time: ${e}` );} );
          }}
        />

      </>
    );
  }
}

export default CameraControls;