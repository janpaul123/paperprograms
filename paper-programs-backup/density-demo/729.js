// Continuous Sound for Density
// Keywords: density, sound, sound generator, view
// ------------------------------- //
// Required Programs (dependencies): Density: Model
// Recommended Programs: Density prefix
// Program Description:

importScripts( 'paper.js' );


( async () => {

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

    phet.tambo.soundManager.addSoundGenerator( densitySound );
    scratchpad.densitySound = densitySound;

    const soundOnWhenIdleTime = 1; // in seconds
    let stopSoundTimeout = null;

    const soundListener = newDensity => {
      if ( sharedData.model.has( 'densityRange' ) ) {
        const densityRange = sharedData.model.get( 'densityRange' );
        if ( !densitySound.isPlaying ) {
          densitySound.play();
        }
        densitySound.setPlaybackRate( 0.5 + newDensity / densityRange.max * 1.5 );

        // Set a timer to turn off the sound when the density is no longer changing.
        if ( stopSoundTimeout ) {
          window.clearTimeout( stopSoundTimeout );
        }
        stopSoundTimeout = window.setTimeout( () => {
          densitySound.stop();
        }, soundOnWhenIdleTime * 1000 );
      }
    };
    scratchpad.linkId = phet.paperLand.addModelPropertyLink( 'densityProperty', soundListener );
  };

  // Called when the paper positions change.
  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchPad, sharedData ) => {

    // No need to observe paper position for this program! However, you could describe the density
    // based on positionPoints instead of densityProperty if you wanted to.
  };

  // Called when the program is changed or no longer detected.
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {

    // remove the sound from tambo and stop it immediately
    scratchpad.densitySound.stop();
    phet.tambo.soundManager.removeSoundGenerator( scratchpad.densitySound );
    delete scratchpad.densitySound;

    // unlink the density listener
    phet.paperLand.removeModelPropertyLink( 'densityProperty', scratchpad.linkId );
    delete scratchpad.linkId;
  };

  // Add the state change handler defined above as data for this paper.
  await paper.set( 'data', {
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
  const canvas = await paper.get( 'canvas' );

  // Draw the name of the program on the canvas
  const ctx = canvas.getContext( '2d' );
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(255,0,0)';
  ctx.fillText( 'Density', canvas.width / 2, canvas.height / 2 - 10 );
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText( 'Sound', canvas.width / 2, canvas.height / 2 + 20 );
} )();
