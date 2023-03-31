// Lander
// Keywords: body, physics, p2, model
// ------------------------------- //
// Required Programs (dependencies): World
// Recommended Programs:
// Program Description:

importScripts('paper.js');

(async () => {

  //----------------------------------------------------------------------
  // Board code
  //----------------------------------------------------------------------

  // Called when the program is detected or changed.
  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    // create a body with p2
    const shipShape = new p2.Circle( { radius: 0.3 } );
    scratchpad.shipBody = new p2.Body( { mass: 1, position: [ 0, 500 ] } );
    scratchpad.shipBody.addShape( shipShape );

    // add the body to the paper land model
    phet.paperLand.addModelComponent( 'lander', scratchpad.shipBody );

    // when the world is available, add the lander to it
    scratchpad.handleWorldExists = world => {
      world.addBody( scratchpad.shipBody );
    }

    // when the world is removed, remove the lander from it
    scratchpad.handleWorldRemoved = world => {
      world.removeBody( scratchpad.shipBody );
      delete scratchpad.shipBody;
    };

    // Attach/detach the lander when the world is available in the model
    phet.paperLand.addModelObserver( 'world', scratchpad.handleWorldExists, scratchpad.handleWorldRemoved );

    scratchpad.viewRectangle = new phet.scenery.Rectangle( 0, 0, 10, 25, { fill: 'red' } );
    sharedData.scene.addChild( scratchpad.viewRectangle );

    // The p2 world steps physics - every frame get the new position for the lander to reposition the image
    scratchpad.timerListener = dt => {
      if ( sharedData.model.has( 'thrustProperty' ) ) {
        const thrust = sharedData.model.get( 'thrustProperty' ).value;
        scratchpad.shipBody.applyForceLocal( [ 0, thrust ], [ 0, 0 ] );
      }

      const position = scratchpad.shipBody.position;
      const viewPosition = sharedData.model.get( 'modelToViewPosition' )( position );
      scratchpad.viewRectangle.center = viewPosition;
    }
    phet.axon.stepTimer.addListener( scratchpad.timerListener );
  };

  // Called when the paper positions change.
  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchpad, sharedData ) => {

  };

  // Called when the program is changed or no longer detected.
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
   phet.paperLand.removeModelObserver( 'world', scratchpad.handleWorldRemoved );
   phet.paperLand.removeModelComponent( 'lander' );

   phet.axon.stepTimer.removeListener( scratchpad.timerListener );
   delete scratchpad.timerListener;

   sharedData.scene.removeChild( scratchpad.viewRectangle );
   delete scratchpad.viewRectangle;

   delete scratchpad.shipBody;
   delete scratchpad.handleWorldRemoved;
   delete scratchpad.handleWorldExists;
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
  ctx.fillText('Model', canvas.width / 2, canvas.height / 2 + 20);
})();
