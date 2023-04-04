// Image Transparency Density Map
// Keywords: density, image, asset, view
// ------------------------------- //
// Required Programs (dependencies): Density: Model
// Recommended Programs: Density prefix
// Program Description:

importScripts( 'paper.js' );

( async () => {

  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {
    const propertyName = 'densityProperty';

    // Global model for all programs
    const model = sharedData.model;

    // Create a Scenery image node.
    const imageElement = document.createElement( 'img' );
    imageElement.setAttribute( 'src', 'media/images/barrel.png' );
    scratchpad.imageNode = new phet.scenery.Image( imageElement, {
      minWidth: 150,
      maxWidth: 150,
      center: new phet.dot.Vector2( 300, 150 )
    } );
    sharedData.scene.addChild( scratchpad.imageNode );

    // This the function to implement to watch the changing Property.
    const densityListener = value => {
      if ( model.has( 'densityRange' ) ) {
        const range = model.get( 'densityRange' );
        scratchpad.imageNode.opacity = Math.max( value / range.max, 0.2 );
      }
    };
    scratchpad.linkId = phet.paperLand.addModelPropertyLink( 'densityProperty', densityListener );
  };

  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    phet.paperLand.removeModelPropertyLink( 'densityProperty', scratchpad.linkId );
    delete scratchpad.linkId;

    sharedData.scene.removeChild( scratchpad.imageNode );
    delete scratchpad.imageNode;
  }

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

  // Get a canvas object for this paper.
  const canvas = await paper.get( 'canvas' );

  // Draw "Hello world" on the canvas.
  const ctx = canvas.getContext( '2d' );
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(255,0,0)';
  ctx.fillText( 'Density', canvas.width / 2, canvas.height / 2 - 10 );
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText( 'Image Transparency', canvas.width / 2, canvas.height / 2 + 20 );
} )();

