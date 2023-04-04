// Altitude: Image Y-Position mapped to Altitude
// Keywords: altitude, image, asset, view
// ------------------------------- //
// Required Programs (dependencies) Altitude: Model
// Recommended Programs: Altitude prefix
// Program Description:

importScripts('paper.js');

(async () => {

  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    //----------------------------------------------------------------------
    // Template Variables
    //----------------------------------------------------------------------
    const propertyName = 'altitudeProperty';

    const imageWidthInPixels = 50; // Must be positive.

    const imageFile = 'girlInAir.png';
    // const imageFile = 'lunarLander.png';
    // const imageFile = 'birdInAir.png';

    //----------------------------------------------------------------------
    
    // Global model for all programs
    const model = sharedData.model;

    const imageElement = document.createElement( 'img' );
    imageElement.setAttribute( 'src', `media/images/${imageFile}` );
    const imageNode = new phet.scenery.Image( imageElement, {
      minWidth: imageWidthInPixels,
      maxWidth: imageWidthInPixels
    } );

    sharedData.scene.addChild( imageNode );

    // This the function to implement to watch the changing Property.
    const componentListener = value => {
      const viewAltitude =  sharedData.displaySize.height * ( 1 - value / 100 ); // 100 is the max of the range
      imageNode.centerY = viewAltitude;
      imageNode.centerX = sharedData.displaySize.width / 2;
    }
    scratchpad.altitudeListenerId = phet.paperLand.addModelPropertyLink( propertyName, componentListener );

    // assign components to the scratchpad so that they can be removed later
    scratchpad.propertyName = propertyName;
    scratchpad.imageNode = imageNode;
  };

  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {

    // Global model for all programs
    const propertyName = scratchpad.propertyName;
    delete scratchpad.propertyName;

    phet.paperLand.removeModelPropertyLink( propertyName, scratchpad.altitudeListenerId );
    delete scratchpad.altitudeListenerId;

    sharedData.scene.removeChild( scratchpad.imageNode );
    delete scratchpad.imageNode;
  }

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
  ctx.fillText('Altitude', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('Image', canvas.width / 2, canvas.height / 2 + 20);
})();

