// Simple: Set Board Background
// Keywords: simple, view, background, color
// =============================== //
// Program Dependencies: N/A
// Recommended Programs: n/a
// Program Description: Changes color of Board background!

importScripts('paper.js');

(async () => {

  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    //=================================================================================================================
    // Easily Changed Parameters

    // const backgroundColor = 'rgb( 0, 100, 100)';
    const backgroundColor = 'skyblue';
    
    
    //=================================================================================================================

    // Create a background rectangle and add it to the view.
    const backgroundRectangle = new phet.scenery.Rectangle( 0, 0, sharedData.displaySize.width, sharedData.displaySize.height, {
      fill: backgroundColor
    } );
    sharedData.scene.addChild( backgroundRectangle );
    backgroundRectangle.moveToBack();

    // Assign to the scratchpad so that we can remove it later.
    scratchpad.backgroundRectangle = backgroundRectangle;
  };
 
  // Called when the program is removed.
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {

    // Remove the background from the view.
    if ( scratchpad.backgroundRectangle ){
      sharedData.scene.removeChild( scratchpad.backgroundRectangle );
      scratchpad.backgroundRectangle = null;
    }
    else {
      alert( 'Error: backgroundRectangle node not found in scratchpad data.' );
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

  // Add text to the canvas.
  const ctx = canvas.getContext('2d');
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(255,0,0)';
  ctx.fillText('Add', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('Background', canvas.width / 2, canvas.height / 2 + 20);
})();

