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
      cameraManualMode: false
    };

    // {MediaStreamTrack|null} - the video track of the camera that is watching the papers
    this.track = null;

    // Get the media stream.
    // TODO: We should probably make the video track part of the state.
    navigator.mediaDevices.getUserMedia( { video: true } )
      .then( mediaStream => {
        this.track = mediaStream.getVideoTracks()[ 0 ];
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

    return (
      <>
        <h3 className={styles.headerWithOption}>Camera Settings</h3>
        <br/>
        <input
          type='checkbox'
          name='manualMode'
          checked={this.state.cameraManualMode}
          onChange={event => {
            this.setState( { cameraManualMode: event.target.checked } );
            const setToManualMode = event.target.checked;
            if ( this.track ) {
              if ( setToManualMode ) {
                console.log( 'Setting camera parameters to manual mode.' );
                this.track.applyConstraints( { advanced: [ { whiteBalanceMode: 'manual' } ] } )
                  .then( () => { this.track.applyConstraints( { advanced: [ { exposureMode: 'manual' } ] } ); } )
                  .then( () => { this.track.applyConstraints( { advanced: [ { exposureTime: 200 } ] } ); } )
                  .catch( error => { console.log( `Error applying constraints: ${error}` ); } );
              }
              else {
                console.log( 'Setting camera parameters to continuous mode.' );
                this.track.applyConstraints( { advanced: [ { whiteBalanceMode: 'continuous' } ] } )
                  .then( () => { this.track.applyConstraints( { advanced: [ { exposureMode: 'continuous' } ] } ); } )
                  .catch( error => { console.log( `Error applying constraints: ${error}` ); } );
              }
            }
          }}
        />
        <label htmlFor='manualMode'>Camera in Manual Mode</label>
      </>
    );
  }
}

export default CameraControls;