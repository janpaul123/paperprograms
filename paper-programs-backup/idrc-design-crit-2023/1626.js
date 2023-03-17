// Density: Continuous Sound for Density
// Keywords: density, sound, sound generator, view
// ------------------------------- //
// Required Programs (dependencies): Density: Model
// Recommended Programs: Density prefix
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
    const densitySound = new phet.tambo.SoundClip( wrappedAudioBuffer, { 
      loop: true,
      initialOutputLevel: 0.1
    } );

    // Global model for all programs
    const model = sharedData.modelProperty.value;

    // Adds a listener to the densityProperty - called when this program is added OR
    // when the densityProperty is added to the global model.
    const addDensityChangedListener = ( densityProperty ) => {

      phet.tambo.soundManager.addSoundGenerator( densitySound );
      scratchpad[ `densitySound${paperProgramNumber}`] = densitySound;

      const soundOnWhenIdleTime = 1; // in seconds
      let stopSoundTimeout = null;

      scratchpad[ `soundListener${paperProgramNumber}` ] = ( newDensity ) => {

        if ( !densitySound.isPlaying ){
          densitySound.play();
        }
        densitySound.setPlaybackRate( 0.5 + newDensity / model.densityRange.max * 1.5 );

        // Set a timer to turn off the sound when the density is no longer changing.
        if ( stopSoundTimeout ){
          window.clearTimeout( stopSoundTimeout );
        }
        stopSoundTimeout = window.setTimeout( () => {
          densitySound.stop();
        }, soundOnWhenIdleTime * 1000 );
      };
      densityProperty.link( scratchpad[ `soundListener${paperProgramNumber}`] );
    }

    if ( model.densityProperty ) {

      // densityProperty was already present when this program was added, add listeners
      addDensityChangedListener( model.densityProperty );
    }

    // add to the scratchpad so that this listener can be removed when this program is removed
    scratchpad[ `modelAddedListener${paperProgramNumber}`] = ( componentName, component ) => {
      if ( componentName === 'densityProperty' ) {
 
        // densityProperty was added AFTER this program was added, add listeners
        addDensityChangedListener( component );
      }
    };
    phet.paperLand.modelComponentAddedEmitter.addListener( scratchpad[ `modelAddedListener${paperProgramNumber}`] );

    scratchpad[ `modelRemovedListener${paperProgramNumber}`] = ( componentName, component ) => {
      if ( componentName === 'densityProperty' ) {

        // densityProperty was removed after this program was added, remove listeners
        component.unlink( scratchpad[ `soundListener${paperProgramNumber}`] );
        delete scratchpad[ `soundListener${paperProgramNumber}`];

        const densitySound = scratchpad[ `densitySound${paperProgramNumber}` ];
        densitySound.stop();
        phet.tambo.soundManager.removeSoundGenerator( densitySound );
        delete scratchpad[ `densitySound${paperProgramNumber}`];
      }
    };
    phet.paperLand.modelComponentRemovedEmitter.addListener( scratchpad[ `modelRemovedListener${paperProgramNumber}`] );
  };

  // Called when the paper positions change.
  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchPad, sharedData ) => {

    // No need to observe paper position for this program! However, you could describe the density
    // based on positionPoints instead of densityProperty if you wanted to.
  };

  // Called when the program is changed or no longer detected.
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    phet.paperLand.modelComponentAddedEmitter.removeListener( scratchpad[ `modelAddedListener${paperProgramNumber}`] );
    phet.paperLand.modelComponentRemovedEmitter.removeListener( scratchpad[ `modelRemovedListener${paperProgramNumber}`] );

    if ( scratchpad[ `densitySound${paperProgramNumber}`] ) {

      sharedData.modelProperty.value.densityProperty.unlink( scratchpad[ `soundListener${paperProgramNumber}`] );
      delete scratchpad[ `soundListener${paperProgramNumber}`];

      phet.tambo.soundManager.removeSoundGenerator( scratchpad[ `densitySound${paperProgramNumber}`] );
      delete scratchpad[ `densitySound${paperProgramNumber}`];
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
  ctx.fillText('Density', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('Sound', canvas.width / 2, canvas.height / 2 + 20);
})();