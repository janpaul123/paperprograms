// World
// Keywords: gravity, physics, model
// ------------------------------- //
// Required Programs (dependencies) [none]
// Recommended Programs: 
// Program Description: Creates a world for lunar lander.

importScripts('paper.js');

(async () => {

  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    // create a world with p2 physics and add to the global model
    const world = new p2.World();
    phet.paperLand.addModelComponent( 'world', world );

    // create "ground" so the lander stops at the bottom
    const planeShape = new p2.Plane();
    const planeBody = new p2.Body();
    planeBody.addShape( planeShape );
    world.addBody( planeBody );

    // Add a function to the model to convert from p2 model coordinates to view coordinates
    const modelToViewPosition = modelPosition => {
      return new phet.dot.Vector2( modelPosition[ 0 ] + sharedData.displaySize.width / 2, sharedData.displaySize.height - modelPosition[ 1 ] );
    };
    phet.paperLand.addModelComponent( 'modelToViewPosition', modelToViewPosition );

    // move physics bodies forward in time
    scratchpad.stepListener = dt => {
      world.step( dt );
    }
    phet.axon.stepTimer.addListener( scratchpad.stepListener );
  };

  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    phet.paperLand.removeModelComponent( 'world' );

    phet.axon.stepTimer.removeListener( scratchpad.stepListener );
    delete scratchpad.stepListener;
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

  // Draw "Hello world" on the canvas.
  const ctx = canvas.getContext('2d');
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(255,0,0)';
  ctx.fillText('Hello', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('world', canvas.width / 2, canvas.height / 2 + 20);
})();
