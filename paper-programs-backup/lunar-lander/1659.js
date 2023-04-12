// Thrust Sound
// Keywords: thrust, sound, sound generator, view
// ------------------------------- //
// Required Programs (dependencies): Thrust
// Recommended Programs:
// Program Description:

importScripts('paper.js');

(async () => {

  //----------------------------------------------------------------------
  // Board code
  //----------------------------------------------------------------------

  // Called when the program is detected or changed.
  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    // Create and add the sound generator.
    const wrappedAudioBuffer = createAndLoadWrappedAudioBuffer( 'media/sounds/looping-thrust.mp3' );
    const thrustSound = new phet.tambo.SoundClip( wrappedAudioBuffer, { 
      loop: true,
      initialOutputLevel: 0.1
    } );
    scratchpad.thrustSound = thrustSound;

    const outputLevelRange = new phet.dot.Range( 0, 0.8 );

    phet.tambo.soundManager.addSoundGenerator( thrustSound );

    // Called when it is possible to attach to the model component
    const handleAttach = thrustProperty => {

      // The actual work to do with the changing thrust
      scratchpad.thrustListener = thrust => {
        if ( thrust.magnitude === 0 ) {
          thrustSound.stop();
        }
        else if ( !thrustSound.isPlaying ) {
          thrustSound.play();
        }

        thrustSound.outputLevel = outputLevelRange.constrainValue( thrust.magnitude * 1 / 18 );
      };

      thrustProperty.link( scratchpad.thrustListener );
    };

    // Called when the model component or this program is removed
    const handleDetach = thrustProperty => {

      // remove the listener from the Property
      thrustProperty.unlink( scratchpad.thrustListener );
      delete scratchpad.thrustProperty;

      // extra work - in this case stopping sound
      thrustSound.stop();
    }

    scratchpad.observerId = phet.paperLand.addModelObserver( 'landerThrustProperty', handleAttach, handleDetach );
  };

  // Called when the paper positions change.
  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchPad, sharedData ) => {

    // No need to observe paper position for this program! However, you could describe the altitude
    // based on positionPoints instead of altitudeProperty if you wanted to.
  };

  // Called when the program is changed or no longer detected.
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    scratchpad.thrustSound.stop();
    phet.tambo.soundManager.removeSoundGenerator( scratchpad.thrustSound );
    delete scratchpad.thrustSound;

    phet.paperLand.removeModelObserver( 'landerThrustProperty', scratchpad.observerId );
    delete scratchpad.observerId;
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
