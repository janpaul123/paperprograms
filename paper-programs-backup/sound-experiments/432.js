// Sound for Altitude
// 

importScripts('paper.js');

(async () => {

  const onProgramAdded =  ( paperProgramNumber, scratchpad, sharedData ) => {

    const availableSoundFiles = [
      'stringsLoopMiddleCOscilloscope.mp3',
      'saturatedSineLoop220Hz.mp3',
      'loonCall.mp3',
      'windsLoopC3Oscilloscope.mp3',
      'chargesInBody.mp3'
    ];

    //=================================================================================================================
    // Easily Changed Parameters

    const soundFileNumber = 1; // must be from 0 to 4, inclusive
    
    //=================================================================================================================

    const soundFileName = availableSoundFiles[ soundFileNumber ];

    if ( scratchpad.addAltitudeSoundGeneratorListener ) {
      alert( 'Already a listener to create the altitude sound generator!' );
    }
    else {
      scratchpad.addAltitudeSoundGeneratorListener = model => {
        if ( model.altitudeProperty ) {
          console.log( 'adding sound generator for altitude' );

          const altitudeRange = new phet.dot.Range( 0, 10 );

          // Create and add the sound generator.
          const wrappedAudioBuffer = createAndLoadWrappedAudioBuffer( `media/sounds/${soundFileName}` );
          const altitudeSound = new phet.tambo.SoundClip( wrappedAudioBuffer, { 
            loop: true,
            initialOutputLevel: 0.1
          } );
          phet.tambo.soundManager.addSoundGenerator( altitudeSound );
          scratchpad.altitudeSound = altitudeSound;

          const soundOnWhenIdleTime = 0.3; // in seconds
          let stopSoundTimeout = null;

          // Add a listener to start the sound playing when the altitude changes and adjust the playback rate.
          scratchpad.altitudeChangedListener = ( newAltitude, oldAltitude ) => {
            if ( !altitudeSound.isPlaying ){
              altitudeSound.play();
            }
            altitudeSound.setPlaybackRate( 0.5 + newAltitude / altitudeRange.max * 1.5 );

            // Set a timer to turn off the sound when the altitude is no longer changing.
            if ( stopSoundTimeout ){
              window.clearTimeout( stopSoundTimeout );
            }
            stopSoundTimeout = window.setTimeout( () => {
              altitudeSound.stop();
            }, soundOnWhenIdleTime * 1000 );

          };
          model.altitudeProperty.lazyLink( scratchpad.altitudeChangedListener );
        }
        else {
          alert( 'The property needed by this sound generator is not present in the model, so the sound generator can\'t be added.' );
        }
      };

      sharedData.modelProperty.link( scratchpad.addAltitudeSoundGeneratorListener );
    }
  };

  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    if ( scratchpad.altitudeSound ){
      sharedData.modelProperty.unlink( scratchpad.addAltitudeSoundGeneratorListener );
      if ( sharedData.modelProperty.altitudeProperty && scratchpad.altitudeChangedListener ){
        sharedData.modelProperty.altitudeProperty.unlink( scratchpad.altitudeChangedListener );    
      }
      phet.tambo.soundManager.removeSoundGenerator( scratchpad.altitudeSound );
      scratchpad.altitudeSound = null;
    }
    else{
      alert( 'Error: Altitude sound generator not found in scratchpad data.' );
    }
  };

  // Add the state change handler defined above as data for this paper.
  await paper.set('data', {
    paperPlaygroundData: {
      updateTime: Date.now(),
      eventHandlers: {
        onProgramAdded: onProgramAdded.toString(),
        onProgramRemoved: onProgramRemoved.toString()
      }
    }
  } );

    // Get a canvas object for this paper.
  const canvas = await paper.get('canvas');

  // Draw a message on the canvas.
  const ctx = canvas.getContext('2d');
  ctx.font = '20px serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(255,0,0)';
  ctx.fillText( 'Altitude', canvas.width / 2, canvas.height / 2 - 10 );
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText( 'Sound Gen', canvas.width / 2, canvas.height / 2 + 20 );
})();
