// Altitude Image
// Keywords: template, space, lander

importScripts('paper.js');

(async () => {

  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    const availableImages = [
      'girlInAir.png',
      'lunarLander.png',
      'birdInAir.png'
    ];

    //=================================================================================================================
    // Easily Changed Parameters

    const imageToDisplay = availableImages[ 0 ]; // Valid values are from 0 to 2, inclusive.
    const imageWidthInPixels = 50; // Must be positive.
    const proportionateXPosition = 0.7; // Valid values are from 0 to 1, inclusive.
    
    //=================================================================================================================

    // Create a Scenery image node.
    const imageElement = document.createElement( 'img' );
    imageElement.setAttribute( 'src', `media/images/${imageToDisplay}` );
    const imageNode = new phet.scenery.Image( imageElement, {
      minWidth: imageWidthInPixels,
      maxWidth: imageWidthInPixels
    } );

    // Add to the view
    sharedData.scene.addChild( imageNode );

    // Assign to the scratchpad so that we can move it and remove it later
    scratchpad.imageNode = imageNode;

    // Adjust the position of the image as the altitude property changes.
    const model = sharedData.model;
    if ( model.altitudeProperty ) {

      // Assign to the scratchpad so we can unlink when the program is removed
      scratchpad.altitudeListener = altitude => {
        const viewAltitude =  sharedData.displaySize.height * ( 1 - altitude / 10 );
        imageNode.centerY = viewAltitude;
        imageNode.centerX = proportionateXPosition * sharedData.displaySize.width;
      };
      model.altitudeProperty.link( scratchpad.altitudeListener );
    }
    else {
      alert( 'No altitudeProperty in model, add that program first' );
    }
  };
 
  // Called when the program is removed.
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    const model = sharedData.model;

    // Remove the image from the view
    if ( scratchpad.imageNode ){
      sharedData.scene.removeChild( scratchpad.imageNode );
      scratchpad.imageNode = null;
    }
    else {
      alert( 'Error: imageNode node not found in scratchpad data.' );
    }

    // Remove the listener that moves the image with the model
    if ( model.altitudeProperty && scratchpad.altitudeListener ) {
      model.altitudeProperty.unlink( scratchpad.altitudeListener );
      scratchpad.altitudeListener = null;
    }
    else {
      alert( 'altitudeProperty and altitudeListener missing during removal' );
    }
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

  // Write a message on the Canvas.
  const ctx = canvas.getContext('2d');
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(155,25,34)';
  ctx.fillText('Image at', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(155,25,34)';
  ctx.fillText('Altitude', canvas.width / 2, canvas.height / 2 + 20);
})();
