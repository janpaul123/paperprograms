// Target
// Keywords: p2, body, platform, target
// ------------------------------- //
// Required Programs (dependencies):
// Recommended Programs:
// Program Description:

importScripts('paper.js');

(async () => {

  //----------------------------------------------------------------------
  // Board code
  //----------------------------------------------------------------------

  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    // create a target shape body for p2 physics engine
    const targetShape = new p2.Box( { width: 150, height: 15 } );
    scratchpad.targetBody = new p2.Body( {

      // zero mass means this body is static and doesn't respond to forces
      mass: 0
    } );
    scratchpad.targetBody.addShape( targetShape );

    // add the body to the paper land model
    phet.paperLand.addModelComponent( 'target', scratchpad.targetBody );

    // The view component for the target
    scratchpad.targetRectangle = new phet.scenery.Rectangle( 0, 0, 150, 15, {
      fill: '#1E90FF'
    } );

    // When the world is available, we will add the model component to the world
    // and the view component to the display
    const handleWorldExists = world => {
      world.addBody( scratchpad.targetBody );
      sharedData.scene.addChild( scratchpad.targetRectangle );
    };

    // When the world (or this program) is removed, we remove the model and view componets
    const handleWorldRemoved = world => {
      world.removeBody( scratchpad.targetBody );
      sharedData.scene.removeChild( scratchpad.targetRectangle );
    }
    scratchpad.observerId = phet.paperLand.addModelObserver( 'world', handleWorldExists, handleWorldRemoved );
  };

  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchpad, sharedData ) => {

    if ( sharedData.model.has( 'viewToModelPosition' ) ) {

      // This is the center in x or y dimensions of the paper, normalized from 0 to 1.
      const paperCenterX = ( positionPoints[ 0 ].x + positionPoints[ 2 ].x ) / 2;
      const paperCenterY = ( positionPoints[ 0 ].y + positionPoints[ 2 ].y ) / 2;

      const centerX = paperCenterX * sharedData.displaySize.width;
      const centerY = paperCenterY * sharedData.displaySize.height;
      const viewCenter = new phet.dot.Vector2( centerX, centerY );

      // The model has a utility function to convert from view to model coordinates (since papers
      // are in view coordinates).
      const modelPosition = sharedData.model.get( 'viewToModelPosition' )( viewCenter );

      // Position the body in the physics engine
      scratchpad.targetBody.position = [ modelPosition.x, modelPosition.y ];

      // position the component in the view
      scratchpad.targetRectangle.center = viewCenter;
    }
  };

  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    phet.paperLand.removeModelObserver( 'world', scratchpad.observerId );
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
  ctx.fillText('Control', canvas.width / 2, canvas.height / 2 + 20);
})();



