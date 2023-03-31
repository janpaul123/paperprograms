// Altitude: Continuous Sound for Altitude Magnitude - Copy
// Keywords: altitude, sound, sound generator, view
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

    const availableSoundFiles = [
      'stringsLoopMiddleCOscilloscope.mp3',
      'saturatedSineLoop220Hz.mp3',
      'loonCall.mp3',
      'windsLoopC3Oscilloscope.mp3',
      'chargesInBody.mp3'
    ];

    // Create and add the sound generator.
    const wrappedAudioBuffer = createAndLoadWrappedAudioBuffer( `media/sounds/${availableSoundFiles[ 4 ]}` );
    const altitudeSound = new phet.tambo.SoundClip( wrappedAudioBuffer, { 
      loop: true,
      initialOutputLevel: 0.1
    } );

    // Global model for all programs
    const model = sharedData.model;

    // Adds a listener to the altitudeProperty - called when this program is added OR
    // when the altitudeProperty is added to the global model.
    const addAltitudeChangedListener = ( altitudeProperty ) => {

      phet.tambo.soundManager.addSoundGenerator( altitudeSound );
      scratchpad[ `altitudeSound${paperProgramNumber}`] = altitudeSound;

      const soundOnWhenIdleTime = 1; // in seconds
      let stopSoundTimeout = null;

      scratchpad[ `soundListener${paperProgramNumber}` ] = ( newAltitude ) => {

        if ( !altitudeSound.isPlaying ){
          altitudeSound.play();
        }
        altitudeSound.setPlaybackRate( 0.5 + newAltitude / altitudeProperty.range.max * 1.5 );

        // Set a timer to turn off the sound when the altitude is no longer changing.
        if ( stopSoundTimeout ){
          window.clearTimeout( stopSoundTimeout );
        }
        stopSoundTimeout = window.setTimeout( () => {
          altitudeSound.stop();
        }, soundOnWhenIdleTime * 1000 );
      };
      altitudeProperty.link( scratchpad[ `soundListener${paperProgramNumber}`] );
    }

    if ( model.altitudeProperty ) {

      // altitudeProperty was already present when this program was added, add listeners
      addAltitudeChangedListener( model.altitudeProperty );
    }

    // add to the scratchpad so that this listener can be removed when this program is removed
    scratchpad[ `modelAddedListener${paperProgramNumber}`] = ( componentName, component ) => {
      if ( componentName === 'altitudeProperty' ) {
 
        // altitudeProperty was added AFTER this program was added, add listeners
        addAltitudeChangedListener( component );
      }
    };
    phet.paperLand.modelComponentAddedEmitter.addListener( scratchpad[ `modelAddedListener${paperProgramNumber}`] );

    scratchpad[ `modelRemovedListener${paperProgramNumber}`] = ( componentName, component ) => {
      if ( componentName === 'altitudeProperty' ) {

        // altitudeProperty was removed after this program was added, remove listeners
        component.unlink( scratchpad[ `soundListener${paperProgramNumber}`] );
        delete scratchpad[ `soundListener${paperProgramNumber}`];

        const altitudeSound = scratchpad[ `altitudeSound${paperProgramNumber}` ];
        altitudeSound.stop();
        phet.tambo.soundManager.removeSoundGenerator( altitudeSound );
        delete scratchpad[ `altitudeSound${paperProgramNumber}`];
      }
    };
    phet.paperLand.modelComponentRemovedEmitter.addListener( scratchpad[ `modelRemovedListener${paperProgramNumber}`] );
  };

  // Called when the paper positions change.
  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchPad, sharedData ) => {

    // No need to observe paper position for this program! However, you could describe the altitude
    // based on positionPoints instead of altitudeProperty if you wanted to.
  };

  // Called when the program is changed or no longer detected.
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    phet.paperLand.modelComponentAddedEmitter.removeListener( scratchpad[ `modelAddedListener${paperProgramNumber}`] );
    phet.paperLand.modelComponentRemovedEmitter.removeListener( scratchpad[ `modelRemovedListener${paperProgramNumber}`] );

    if ( scratchpad[ `altitudeSound${paperProgramNumber}`] ) {

      sharedData.model.get('altitudeProperty').unlink( scratchpad[ `soundListener${paperProgramNumber}`] );
      delete scratchpad[ `soundListener${paperProgramNumber}`];

      phet.tambo.soundManager.removeSoundGenerator( scratchpad[ `altitudeSound${paperProgramNumber}`] );
      delete scratchpad[ `altitudeSound${paperProgramNumber}`];
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
  ctx.fillText('Sound', canvas.width / 2, canvas.height / 2 + 20);
})();
