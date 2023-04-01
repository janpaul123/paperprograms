// Altitude: Change Altitude with Paper Position
// Keywords: altitude, model, positionPoints
// ------------------------------- //
// Required Programs (dependencies): Altitude: Model
// Recommended Programs: Altitude prefix
// Program Description: Sets the Altitude property value set in Altitude Model by
// the center position of this paper.

importScripts('paper.js');

(async () => {

  //----------------------------------------------------------------------
  // Board code
  //----------------------------------------------------------------------

  // Get the paper number of this piece of paper (which should not change).
  const myPaperNumber = await paper.get('number');

  // Called when the program is detected or changed. Create new components here.
  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {
    // Nothing to create! This program controls an existing model Property.
  };

  // Called when the paper positions change.
  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchPad, sharedData ) => {
    
    // Global model for all programs
    const model = sharedData.model;

    if ( model.has( 'altitudeProperty' ) ) {
      const altitudeProperty = model.get( 'altitudeProperty' );
      const range = altitudeProperty.range;

      // This is the center in x or y dimensions of the paper, normalized from 0 to 1.
      // Graphics coordinate system has 0 at top so subtract from 1 so that 0 is at the bottom.
      let paperCenterY = 1 - ( positionPoints[ 0 ].y + positionPoints[ 2 ].y ) / 2;
      const newValue = paperCenterY * range.max;

      // make sure value is within the range
      const constrainedValue = Math.max( Math.min( newValue, range.max ), range.min );
      altitudeProperty.value = constrainedValue;
    }
  };

  // Called when the program is changed or no longer detected. Destroy components here.
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    // Nothing to destroy! This program is only a controller.
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
  ctx.fillText('Control', canvas.width / 2, canvas.height / 2 + 20);
})();


