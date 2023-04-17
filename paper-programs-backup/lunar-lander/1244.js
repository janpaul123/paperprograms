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
      mass: 1, // initial mass, to be updated
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
    const landerThrustProperty = new phet.axon.Property( new phet.dot.Vector2( 0, 0 ) );
    const landerMassProperty = new phet.axon.Property( 1 );
    phet.paperLand.addModelComponent( 'landerThrustProperty', landerThrustProperty );
    phet.paperLand.addModelComponent( 'landerPositionProperty', landerPositionProperty );
    phet.paperLand.addModelComponent( 'landerVelocityProperty', landerVelocityProperty );
    phet.paperLand.addModelComponent( 'landerAccelerationProperty', landerAccelerationProperty );
    phet.paperLand.addModelComponent( 'landerForceProperty', landerForceProperty );
    phet.paperLand.addModelComponent( 'landerMassProperty', landerMassProperty );

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
    const handleWorldExists = world => {
      world.addBody( scratchpad.shipBody );

      // TODO: This component needs many model other components to work (world, worldStepEmitter, modeltoViewPosition).
      // It would be better if we could observer many model components with a `handleComponentsExist` type function.
      // Instead, we have to nest these 'handleComponentExists' calls.
      const handleWorldStepEmitterExists = worldStepEmitter => {
        scratchpad.worldStepListener = () => {

          // after p2 physics updated the body, update Properties for the lander
          const positionArray = scratchpad.shipBody.position;
          landerPositionProperty.set( new phet.dot.Vector2( positionArray[ 0 ], positionArray[ 1 ] ) );

          const velocityArray = scratchpad.shipBody.velocity;
          landerVelocityProperty.set( new phet.dot.Vector2( velocityArray[ 0 ], velocityArray[ 1 ] ) );

          const forceArray = scratchpad.shipBody.force;
          landerForceProperty.set( new phet.dot.Vector2( forceArray[ 0 ], forceArray[ 1 ] ) );

          // because F = mA (acceleration is not a field in p2)
          const mass = landerMassProperty.value;
          landerAccelerationProperty.set( new phet.dot.Vector2( forceArray[ 0 ] / mass, forceArray[ 1 ] / mass ) );

          // re-position the view rectangle
          const viewPosition = sharedData.model.get( 'modelToViewPosition' )( landerPositionProperty.value );
          scratchpad.imageNode.center = viewPosition;
        };

        worldStepEmitter.addListener( scratchpad.worldStepListener );
      };

      const handleWorldStepEmitterRemoved = worldStepEmitter => {
        worldStepEmitter.removeListener( scratchpad.worldStepListener );
        delete scratchpad.worldStepListener;
      };

      // When the step emitter is available from the model, use it
      scratchpad.stepObserverId = phet.paperLand.addModelObserver(
        'worldStepEmitter',
        handleWorldStepEmitterExists,
        handleWorldStepEmitterRemoved
      );
    }

    // when the world is removed, remove the lander from it
    const handleWorldRemoved = world => {
      world.removeBody( scratchpad.shipBody );

      phet.paperLand.removeModelObserver( 'worldStepEmitter', scratchpad.stepObserverId );
      delete scratchpad.stepObserverId;
    };

    // Attach/detach the lander when the world is available in the model
    scratchpad.observerId = phet.paperLand.addModelObserver(
      'world',
      handleWorldExists,
      handleWorldRemoved
    );

    // update the mass for the p2 lander body when the model Property changes
    scratchpad.massObserverId = phet.paperLand.addModelPropertyLink( 'landerMassProperty', mass => {
      scratchpad.shipBody.mass = mass;
    } );

    // Apply thrust over time
    scratchpad.timerListener = dt => {
      if ( sharedData.model.has( 'landerThrustProperty' ) ) {
        const thrust = sharedData.model.get( 'landerThrustProperty' ).value;
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
    phet.paperLand.removeModelObserver( 'world', scratchpad.observerId );
    delete scratchpad.observerId;

    phet.paperLand.removeModelPropertyLink( 'landerMassProperty', scratchpad.massObserverId );
    delete scratchpad.massObserverId;

    phet.paperLand.removeModelComponent( 'lander' );

    phet.paperLand.removeModelComponent( 'landerPositionProperty' );
    phet.paperLand.removeModelComponent( 'landerVelocityProperty' );
    phet.paperLand.removeModelComponent( 'landerAccelerationProperty' );
    phet.paperLand.removeModelComponent( 'landerForceProperty' );
    phet.paperLand.removeModelComponent( 'landerThrustProperty' );
    phet.paperLand.removeModelComponent( 'landerMassProperty' );

    phet.axon.stepTimer.removeListener( scratchpad.timerListener );
    delete scratchpad.timerListener;

    sharedData.scene.removeChild( scratchpad.imageNode );
    delete scratchpad.imageNode;

    delete scratchpad.shipBody;
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
