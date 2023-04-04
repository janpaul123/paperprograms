// Add Image
// Keywords: view, asset, image, simple
// ------------------------------- //
// Required Programs (dependencies) [none]
// Recommended Programs (work well with no modifications, but not necessary) [none]

importScripts('paper.js');

(async () => {

  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {
    console.log( `onProgramAdded called for ppn ${paperProgramNumber}`);

    if ( scratchpad.imageNode ) {
      alert( 'There is alreayd an imageNode on the scratchpad!' );
    }

    // const imageSource = 'girlInAir.png';
    const imageSource = 'lunarLander.png';

    // Create a Scenery image node.
    const imageElement = document.createElement( 'img' );
    imageElement.setAttribute( 'src', `media/images/${imageSource}` );
    const imageNode = new phet.scenery.Image( imageElement, {
      maxWidth: 70
    } );

    sharedData.scene.addChild( imageNode );

    scratchpad.imageNode = imageNode;
  };

  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchpad, sharedData ) => {
    console.log( `onProgramChangedPosition called for ppn ${paperProgramNumber}`);

    if ( scratchpad.imageNode ){

      // Center the image based on the position of the paper.
      const paperCenterX = ( positionPoints[0].x + positionPoints[1].x ) / 2;
      const paperCenterY = ( positionPoints[0].y + positionPoints[2].y ) / 2;
      scratchpad.imageNode.centerX = paperCenterX * sharedData.displaySize.width;
      scratchpad.imageNode.centerY = paperCenterY * sharedData.displaySize.height;
    }
  };

  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    console.log( `onProgramRemoved called for ppn ${paperProgramNumber}`);
    if ( scratchpad.imageNode ){
      sharedData.scene.removeChild( scratchpad.imageNode );
      scratchpad.imageNode = null;
    }
    else{
      alert( 'Error: Image node not found in scratchpad data.' );
    }
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

  // Get a canvas object for this paper.
  const canvas = await paper.get('canvas');

  // Draw a message to the Canvas
  const ctx = canvas.getContext('2d');
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(155,25,34)';
  ctx.fillText('PhET', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(155,25,34)';
  ctx.fillText('image', canvas.width / 2, canvas.height / 2 + 20);
})();

