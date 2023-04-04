// Lander Voicing
// Keywords: lander, voicing, view, polling
// ------------------------------- //
// Required Programs (dependencies):
// Recommended Programs:
// Program Description:

importScripts('paper.js');

(async () => {

  //----------------------------------------------------------------------
  // Board code
  //----------------------------------------------------------------------

  // Called when the program is detected or changed.
  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    scratchpad.handleLanderExists = landerVelocityProperty => {
      const voicingStepListener = dt => {
        const velocity = landerVelocityProperty.value;

        if ( velocity.magnitude < 1 ) {
          phet.scenery.voicingUtteranceQueue.addToBack( `Lander not moving.` );  
        }
        else {

          // Default for MovementAlerter describes -y up
          const describerVelocity = new phet.dot.Vector2( velocity.x, -velocity.y );
          const directionString = phet.sceneryPhet.MovementAlerter.getDirectionDescriptionFromAngle(
            describerVelocity.angle
          );
          phet.scenery.voicingUtteranceQueue.addToBack( `Lander moving ${directionString}` );
        }
      };
      scratchpad.intervalListener = phet.axon.stepTimer.setInterval( voicingStepListener, 7000 );
    };

    scratchpad.handleLanderRemoved = lander => {
      phet.axon.stepTimer.clearInterval( scratchpad.intervalListener );
    }

    scratchpad.observerId = phet.paperLand.addModelObserver( 'landerVelocityProperty', scratchpad.handleLanderExists, scratchpad.handleLanderRemoved );
  };

  // Called when the paper positions change.
  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchPad, sharedData ) => {
  };

  // Called when the program is changed or no longer detected.
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    phet.paperLand.removeModelObserver( 'landerVelocityProperty', scratchpad.handleLanderRemoved, scratchpad.observerId );
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
  ctx.fillText('Voice', canvas.width / 2, canvas.height / 2 + 20);
})();
