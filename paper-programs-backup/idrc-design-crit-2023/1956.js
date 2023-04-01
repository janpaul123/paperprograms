// Altitude: Voice Altitude Value
// Keywords: altitude, voicing, view
// ------------------------------- //
// Required Programs (dependencies) Altitude: Model
// Recommended Programs: Altitude prefix
// Program Description:

importScripts('paper.js');

(async () => {

  //----------------------------------------------------------------------
  // Board code
  //----------------------------------------------------------------------

  // Called when the program is detected or changed.
  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    // Global model for all programs
    const model = sharedData.model;

    // Create new components here!
    const utterance = new phet.utteranceQueue.Utterance( {
      priority: 5
    } );

    let previousDescribedAltitude = 0;

    const altitudeVoicingListener = ( newAltitude ) => {
      const valueChange = Math.abs( newAltitude - previousDescribedAltitude );

      // if the value changed enough to voicing something new...
      if ( valueChange > 15 ) {

        let voicingContent = '';
        if ( newAltitude > 88 ) {
          voicingContent = 'At extreme altitude! You are a cosmic climber!';
        }
        else if ( newAltitude > 70 ) {
          voicingContent = 'At very high altitude! You are at the edge of space!';
        }
        else if ( newAltitude > 50 ) {
          voicingContent = 'At high altitude! You are a stratospheric soarer!';
        }
        else if ( newAltitude > 40 ) {
          voicingContent = 'At medium altitude! You are a cloud cruiser!';
        }
        else if ( newAltitude > 20 ) {
          voicingContent = 'At low altitude! You are a tree top flyer!';
        }
        else {
          voicingContent = 'At sea level! You are in the splash zone!';
        }

        utterance.alert = voicingContent;
        phet.scenery.voicingUtteranceQueue.addToBack( utterance );

        previousDescribedAltitude = newAltitude;
      }
    };

    scratchpad.altitudeObserverId = phet.paperLand.addModelPropertyLink( 'altitudeProperty', altitudeVoicingListener );
  };

  // Called when the paper positions change.
  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchPad, sharedData ) => {

    // No need to observe paper position for this program! However, you could describe the altitude
    // based on positionPoints instead of altitudeProperty if you wanted to.
  };

  // Called when the program is changed or no longer detected.
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    phet.paperLand.removeModelPropertyLink( 'altitudeProperty', scratchpad.altitudeObserverId );
    delete scratchpad.altitudeObserverId;
  };

  // Add the state change handler defined above as data for this paper.
  await paper.set('data', {
    paperPlaygroundData: {
      updateTime: Date.now(),
      eventHandlers: {
        onProgramAdded: onProgramAdded.toString(),
        onProgramChangedPosition: onProgramChangedPosition.toString(),
        onProgramRemoved: onProgramRemoved.toString()
      }
    }
  } );

  //----------------------------------------------------------------------
  // Projector code
  //----------------------------------------------------------------------

  // Get a canvas object for this paper.
  const canvas = await paper.get('canvas');

  // Draw the name of the program on the canvas
  const ctx = canvas.getContext('2d');
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(255,0,0)';
  ctx.fillText('Altitude', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('Voice', canvas.width / 2, canvas.height / 2 + 20);
})();