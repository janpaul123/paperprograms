// Time-Based Model & View Demo
// Keywords: time, time-based, model
// =============================== //
// Program Dependencies: N/A
// Recommended Programs: General Template (templates)
// Program Description: Example program with functioning Board and Projector code!

importScripts( 'paper.js' );

( async () => {

  //----------------------------------------------------------------------
  // Board code
  //----------------------------------------------------------------------

  // Called when the program is detected or changed.
  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    if ( scratchpad.imageNode ) {
      alert( 'There is already an imageNode on the scratchpad!' );
    }

    const imageSource = 'lunarLander.png';

    // Create a Scenery image node.
    const imageElement = document.createElement( 'img' );
    imageElement.setAttribute( 'src', `media/images/${imageSource}` );
    const imageNode = new phet.scenery.Image( imageElement, {
      maxWidth: 70
    } );

    // Add the image to the scene.
    sharedData.scene.addChild( imageNode );

    // Add the image to the scratchpad so that it can be added later.
    scratchpad.imageNode = imageNode;

    // Create a simple model with a position that moves in a circular motion around a
    // center point.  Values are normalized to the screen size.
    const centerPoint = new phet.dot.Vector2( 0.5, 0.5 );
    const positionRelativeToCenter = new phet.dot.Vector2( 0.25, 0 );
    const rotationRate = Math.PI / 2;
    const positionProperty = new phet.axon.Property( phet.dot.Vector2.ZERO );
    scratchpad.stepListener = dt => {
      positionRelativeToCenter.rotate( rotationRate * dt );
      positionProperty.set( centerPoint.plus( positionRelativeToCenter ) );
    }

    // Add the step listener to the step timer to implement time-based behavior.
    phet.axon.stepTimer.addListener( scratchpad.stepListener );

    // Add the postion Property to the shared data model.
    phet.paperLand.addModelComponent( 'positionProperty', positionProperty );

    // Create a listener to update the image position on the display.
    scratchpad.updatePosition = position => {
      imageNode.centerX = sharedData.displaySize.width * position.x;
      imageNode.centerY = sharedData.displaySize.height * position.y;
    };

    // Update the image position as the model position changes.
    positionProperty.link( scratchpad.updatePosition );
  };

  // Called when the program is changed or no longer detected.
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {

    // Disconnect from the step listener.
    if ( scratchpad.stepListener ) {
      console.log( 'removing listener' );
      phet.axon.stepTimer.removeListener( scratchpad.stepListener );
      scratchpad.stepListener = null;
    }
    else {
      alert( 'No step listener found when paper removed.' );
    }

    // Remove the image from the display.
    if ( scratchpad.imageNode ) {
      sharedData.scene.removeChild( scratchpad.imageNode );
      scratchpad.imageNode = null;
    }
    else {
      alert( 'Error: Image node not found in scratchpad data.' );
    }

    // Unhook the image position updater and remove the model element.
    if ( sharedData.model.has('positionProperty') ) {
      sharedData.model.get('positionProperty').unlink( scratchpad.updatePosition );
      scratchpad.updatePosition = null;
      phet.paperLand.removeModelComponent( 'positionProperty' );
    }
    else {
      alert( 'No positionProperty found when paper removed.' );
    }
  };

  // Add the state change handler defined above as data for this paper.
  await paper.set( 'data', {
    paperPlaygroundData: {
      updateTime: Date.now(),
      eventHandlers: {
        onProgramAdded: onProgramAdded.toString(),
        onProgramRemoved: onProgramRemoved.toString()
      }
    }
  } );

  //----------------------------------------------------------------------
  // Projector code
  //----------------------------------------------------------------------

  const canvas = await paper.get( 'canvas' );

  // Draw message on the canvas.
  const ctx = canvas.getContext( '2d' );
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(255,0,0)';
  ctx.fillText( 'Time-Based', canvas.width / 2, canvas.height / 2 - 10 );
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText( 'Demo', canvas.width / 2, canvas.height / 2 + 20 );
  
} )();

