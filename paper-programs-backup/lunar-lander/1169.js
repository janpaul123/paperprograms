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

    // create a Property that will control acceleration due to gravity
    const gravityProperty = new phet.axon.Property( -9.8 );
    phet.paperLand.addModelComponent( 'gravityProperty', gravityProperty );

    // create an Emitter that other programs to listen to that fires an event after p2 physics has completed
    // a step and updated all physical bodies
    const worldStepEmitter = new phet.axon.Emitter();
    phet.paperLand.addModelComponent( 'worldStepEmitter', worldStepEmitter );

    // create "ground" so the lander stops at the bottom
    const planeShape = new p2.Box( { width: sharedData.displaySize.width * 2, height: 1 } );
    const planeBody = new p2.Body( {
      mass: 0 // tells p2 that this body shouldn't respond to forces
    } );
    planeBody.addShape( planeShape );
    world.addBody( planeBody );

    // Add a function to the model to convert from p2 model coordinates to "board view" coordinates
    const modelToViewPosition = modelPosition => {
      return new phet.dot.Vector2( modelPosition.x + sharedData.displaySize.width / 2, sharedData.displaySize.height - modelPosition.y );
    };
    phet.paperLand.addModelComponent( 'modelToViewPosition', modelToViewPosition );

    // Add a function to the model to convert board "view" coordinates to p2 model coordinates
    const viewToModelPosition = viewPosition => {
      return new phet.dot.Vector2(
        viewPosition.x - sharedData.displaySize.width / 2,
        sharedData.displaySize.height - viewPosition.y
      )
    }
    phet.paperLand.addModelComponent( 'viewToModelPosition', viewToModelPosition );

    // move physics bodies forward in time
    scratchpad.stepListener = dt => {
      world.step( dt );
      worldStepEmitter.emit();
    }
    phet.axon.stepTimer.addListener( scratchpad.stepListener );

    // set p2 physics gravity when model gravity changes
    const gravityListener = yGravity => {
      world.gravity = [ 0, yGravity ];
    };
    scratchpad.gravityListenerId = phet.paperLand.addModelPropertyLink( 'gravityProperty', gravityListener );
  };

  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    phet.paperLand.removeModelPropertyLink( 'gravityProperty', scratchpad.gravityListenerId );
    delete scratchpad.gravityListenerId;

    phet.paperLand.removeModelComponent( 'world' );
    phet.paperLand.removeModelComponent( 'worldStepEmitter' );
    phet.paperLand.removeModelComponent( 'gravityProperty' );
    phet.paperLand.removeModelComponent( 'modelToViewPosition' );
    phet.paperLand.removeModelComponent( 'viewToModelPosition' );

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
  ctx.fillText('Lunar', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('Model', canvas.width / 2, canvas.height / 2 + 20);
})();
