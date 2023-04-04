// Print Text Node
// Keywords: simple, view, text
// =============================== //
// Program Dependencies: N/A
// Recommended Programs: Simple: Set board background, Play Test Sound (templates)
// Program Description: Prints density equation - or anything you want - on the board!

importScripts('paper.js');

(async () => {

  //----------------------------------------------------------------------
  // Board code
  //----------------------------------------------------------------------

  // Called when the program is detected or changed.
  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    //=================================================================================================================
    // Easily Changed Parameters

    const message = 'Hello there! Welcome to Paper Playground.'
    const textColor = 'purple';
    const fontSize = 20;
    
    //=================================================================================================================


    if ( scratchpad.textNode ) {
      alert( 'There is already a textNode on the scratchpad!' );
    }

    // Create a Scenery text node.
    const textNode = new phet.scenery.Text( message, {
      font: new phet.sceneryPhet.PhetFont( fontSize ),
      fill: textColor
    } )

    // Add the node to the scene and the scratchpad.
    sharedData.scene.addChild( textNode );
    scratchpad.textNode = textNode;
  };

  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchpad, sharedData ) => {

    if ( scratchpad.textNode ){

      // Center the image based on the position of the paper.
      const paperCenterX = ( positionPoints[0].x + positionPoints[1].x ) / 2;
      const paperCenterY = ( positionPoints[0].y + positionPoints[2].y ) / 2;
      scratchpad.textNode.centerX = paperCenterX * sharedData.displaySize.width;
      scratchpad.textNode.centerY = paperCenterY * sharedData.displaySize.height;
    }
  };

  // Called when the program is changed or no longer detected.
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    if ( scratchpad.textNode ){
      sharedData.scene.removeChild( scratchpad.textNode );
      scratchpad.textNode = null;
    }
    else{
      alert( 'Error: Text node not found in scratchpad data.' );
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

  //----------------------------------------------------------------------
  // Projector code
  //----------------------------------------------------------------------

  const canvas = await paper.get('canvas');

  // Draw a message on the canvas.
  const ctx = canvas.getContext('2d');
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(255,0,0)';
  ctx.fillText('Show', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('Text', canvas.width / 2, canvas.height / 2 + 20);
})();

