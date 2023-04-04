// Gravity Control
// Keywords: gravity, model, control, position

importScripts( 'paper.js' );

( async () => {

  //----------------------------------------------------------------------
  // Board code
  //----------------------------------------------------------------------

  // Get the paper number of this piece of paper (which should not change).
  const myPaperNumber = await paper.get( 'number' );

  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    // The range of values that will control.
    scratchpad.gravityRange = new phet.dot.Range( -25, 0 );
  };

  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchpad, sharedData ) => {
    if ( sharedData.model.has( 'gravityProperty' ) ) {
      const gravityProperty = sharedData.model.get( 'gravityProperty' );

      // get paper centerY - this is a value between 0 (bottom) and 1 (top)
      const normalizedY = 1 - ( positionPoints[ 0 ].y + positionPoints[ 2 ].y ) / 2;

      // map centerY to the gravity range - since gravity is in the -y direction, largest value
      // is at the 'min' of the range
      const gravityValue = normalizedY * scratchpad.gravityRange.min;
      gravityProperty.value = scratchpad.gravityRange.constrainValue( gravityValue );
    }
  };

  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    delete scratchpad.gravityRange;
  };

  // Add the state change handler defined above as data for this paper.
  await paper.set( 'data', {
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
  const canvas = await paper.get( 'canvas' );

  // Draw the name of the program on the canvas
  const ctx = canvas.getContext( '2d' );
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(255,0,0)';
  ctx.fillText( 'Linear', canvas.width / 2, canvas.height / 2 - 10 );
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText( 'Value', canvas.width / 2, canvas.height / 2 + 20 );
} )();




