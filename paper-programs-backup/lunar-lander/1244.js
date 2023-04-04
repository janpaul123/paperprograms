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
    const shipShape = new p2.Box( { width: 75, height: 45 } );
    scratchpad.shipBody = new p2.Body( {
      mass: 1,
      position: [ 0, 200 ], // initial position
      fixedRotation: true // don't let this physical body rotate
    } );
    scratchpad.shipBody.addShape( shipShape );

    // add the body to the paper land model
    phet.paperLand.addModelComponent( 'lander', scratchpad.shipBody );

    // create an axon Property for each physical attribute of the lander you care about - all to be updated
    // by the p2 physics engine
    const landerPositionProperty = new phet.axon.Property( new phet.dot.Vector2( 0, 0 ) );
    const landerVelocityProperty = new phet.axon.Property( new phet.dot.Vector2( 0, 0 ) );
    const landerAccelerationProperty = new phet.axon.Property( new phet.dot.Vector2( 0, 0 ) );
    const landerForceProperty = new phet.axon.Property( new phet.dot.Vector2( 0, 0 ) );
    phet.paperLand.addModelComponent( 'landerPositionProperty', landerPositionProperty );
    phet.paperLand.addModelComponent( 'landerVelocityProperty', landerVelocityProperty );
    phet.paperLand.addModelComponent( 'landerAccelerationProperty', landerAccelerationProperty );
    phet.paperLand.addModelComponent( 'landerForceProperty', landerForceProperty );

    // Create a visualization for the lander itself
        // Create a Scenery image node.
    const imageElement = document.createElement( 'img' );
    imageElement.setAttribute( 'src', 'media/images/lunarLander.png' );
    scratchpad.imageNode = new phet.scenery.Image( imageElement, {
      minWidth: 75,
      maxWidth: 75
    } );
    sharedData.scene.addChild( scratchpad.imageNode );

    // when the world is available, add the lander to it and listeners that will update model
    // from the p2 physics
    scratchpad.handleWorldExists = world => {
      console.log( world, scratchpad.shipBody );
      world.addBody( scratchpad.shipBody );

      // TODO: This component needs many model other components to work (world, worldStepEmitter, modeltoViewPosition).
      // It would be better if we could observer many model components with a `handleComponentsExist` type function.
      // Instead, we have to nest these 'handleComponentExists' calls.
      scratchpad.handleWorldStepEmitterExists = worldStepEmitter => {
        scratchpad.worldStepListener = () => {

          // after p2 physics updated the body, update Properties for the lander
          const positionArray = scratchpad.shipBody.position;
          landerPositionProperty.set( new phet.dot.Vector2( positionArray[ 0 ], positionArray[ 1 ] ) );

          const velocityArray = scratchpad.shipBody.velocity;
          landerVelocityProperty.set( new phet.dot.Vector2( velocityArray[ 0 ], velocityArray[ 1 ] ) );

          const forceArray = scratchpad.shipBody.force;
          landerForceProperty.set( new phet.dot.Vector2( forceArray[ 0 ], forceArray[ 1 ] ) );

          // because F = mA (acceleration is not a field in p2)
          const mass = scratchpad.shipBody.mass;
          landerAccelerationProperty.set( new phet.dot.Vector2( forceArray[ 0 ] / mass, forceArray[ 1 ] / mass ) );

          // re-position the view rectangle
          const viewPosition = sharedData.model.get( 'modelToViewPosition' )( landerPositionProperty.value );
          scratchpad.imageNode.center = viewPosition;
        };

        worldStepEmitter.addListener( scratchpad.worldStepListener );
      };

      scratchpad.handleWorldStepEmitterRemoved = worldStepEmitter => {
        worldStepEmitter.removeListener( scratchpad.worldStepListener );
        delete scratchpad.worldStepListener;
      };

      // When the step emitter is available from the model, use it
      scratchpad.stepObserverId = phet.paperLand.addModelObserver(
        'worldStepEmitter',
        scratchpad.handleWorldStepEmitterExists,
        scratchpad.handleWorldStepEmitterRemoved
      );
    }

    // when the world is removed, remove the lander from it
    scratchpad.handleWorldRemoved = world => {
      world.removeBody( scratchpad.shipBody );

      phet.paperLand.removeModelObserver( 'worldStepEmitter', scratchpad.handleWorldStepEmitterRemoved, scratchpad.stepObserverId );
      delete scratchpad.handleWorldStepEmitterRemoved;
      delete scratchpad.stepObserverId;
    };

    // Attach/detach the lander when the world is available in the model
    scratchpad.observerId = phet.paperLand.addModelObserver(
      'world',
      scratchpad.handleWorldExists,
      scratchpad.handleWorldRemoved
    );

    // Apply thrust over time
    scratchpad.timerListener = dt => {
      if ( sharedData.model.has( 'thrustProperty' ) ) {
        const thrust = sharedData.model.get( 'thrustProperty' ).value;
        scratchpad.shipBody.applyForceLocal( [ thrust.x, thrust.y ], [ 0, 0 ] );
      }
    }
    phet.axon.stepTimer.addListener( scratchpad.timerListener );
  };

  // Called when the paper positions change.
  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchpad, sharedData ) => {

    if ( sharedData.model.has( 'viewToModelPosition' ) ) {
      
      // whenever the program is moved, set that as the new lander position and reset all kinematic values
      const paperCenterX = ( positionPoints[ 0 ].x + positionPoints[ 2 ].x ) / 2;
      const paperCenterY = ( positionPoints[ 0 ].y + positionPoints[ 2 ].y ) / 2;

      const centerX = paperCenterX * sharedData.displaySize.width;
      const centerY = paperCenterY * sharedData.displaySize.height;
      const viewCenter = new phet.dot.Vector2( centerX, centerY );

      // The model has a utility function to convert from view to model coordinates (since papers
      // are in view coordinates).
      const modelPosition = sharedData.model.get( 'viewToModelPosition' )( viewCenter );

      scratchpad.shipBody.position = [ modelPosition.x, modelPosition.y ];
      scratchpad.shipBody.velocity = [ 0, 0 ];
      scratchpad.shipBody.force = [ 0, 0 ]; 
    }
  };

  // Called when the program is changed or no longer detected.
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    phet.paperLand.removeModelObserver( 'world', scratchpad.handleWorldRemoved, scratchpad.observerId );
    delete scratchpad.observerId;
    delete scratchpad.handleWorldRemoved;

    phet.paperLand.removeModelComponent( 'lander' );

    phet.paperLand.removeModelComponent( 'landerPositionProperty' );
    phet.paperLand.removeModelComponent( 'landerVelocityProperty' );
    phet.paperLand.removeModelComponent( 'landerAccelerationProperty' );
    phet.paperLand.removeModelComponent( 'landerForceProperty' );

    phet.axon.stepTimer.removeListener( scratchpad.timerListener );
    delete scratchpad.timerListener;

    sharedData.scene.removeChild( scratchpad.imageNode );
    delete scratchpad.imageNode;

    delete scratchpad.shipBody;
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
