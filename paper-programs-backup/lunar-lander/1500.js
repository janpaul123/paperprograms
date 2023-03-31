// Altitude: Voice Altitude Value - Copy
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

    // Adds a listener to the altitudeProperty - called when this program is added OR
    // when the altitudeProperty is added to the global model.
    const addAltitudeChangedListener = ( altitudeProperty ) => {
      let previousDescribedAltitude = altitudeProperty.value;

      scratchpad.altitudeVoicingListener = ( newAltitude ) => {
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

          console.log( voicingContent );
          utterance.alert = voicingContent;
          phet.scenery.voicingUtteranceQueue.addToBack( utterance );

          previousDescribedAltitude = newAltitude;
        }
      };
      altitudeProperty.link( scratchpad.altitudeVoicingListener );
    }

    if ( model.altitudeProperty ) {

      // altitudeProperty was already present when this program was added, set up listeners that will trigger
      // new Voicing responses
      addAltitudeChangedListener( model.altitudeProperty );
    }

    // add to the scratchpad so that this listener can be removed when this program is removed
    scratchpad.altitudeModelComponentAddedListener = ( componentName, component ) => {
      if ( componentName === 'altitudeProperty' ) {
 
        // altitudeProperty was added AFTER this program was added, add listener that trigger new Voicing
        // responses 
        addAltitudeChangedListener( component );
      }
    };
    phet.paperLand.modelComponentAddedEmitter.addListener( scratchpad.altitudeModelComponentAddedListener );

    scratchpad.altitudeModelComponentRemovedListener = ( componentName, component ) => {
      if ( componentName === 'altitudeProperty' ) {

        // altitudeProperty was removed after this program was added, remove listeners that trigger new Voicing
        // responses
        component.unlink( scratchpad.altitudeVoicingListener );
        delete scratchpad.altitudeVoicingListener;
      }
    };
    phet.paperLand.modelComponentRemovedEmitter.addListener( scratchpad.altitudeModelComponentRemovedListener );
  };

  // Called when the paper positions change.
  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchPad, sharedData ) => {

    // No need to observe paper position for this program! However, you could describe the altitude
    // based on positionPoints instead of altitudeProperty if you wanted to.
  };

  // Called when the program is changed or no longer detected.
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {

    // Global model for all programs
    const model = sharedData.model;

    if ( scratchpad.altitudeModelComponentAddedListener ) {
      phet.paperLand.modelComponentAddedEmitter.removeListener( scratchpad.altitudeModelComponentAddedListener );
    }
    if ( scratchpad.altitudeModelComponentRemovedListener ) {
      phet.paperLand.modelComponentRemovedEmitter.removeListener( scratchpad.altitudeModelComponentRemovedListener );
    }
    if ( scratchpad.altitudeVoicingListener && model.altitudeProperty ) {
      model.altitudeProperty.unlink( scratchpad.altitudeVoicingListener );
    }
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
