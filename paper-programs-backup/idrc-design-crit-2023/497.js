// Density: Change Volume with Paper Area
// Keywords: density, model, paperPositions
// ------------------------------- //
// Required Programs (dependencies): Density: Model
// Recommended Programs: Density: Voice Volume Value
// Program Description:

importScripts('paper.js');

(async () => {

  //----------------------------------------------------------------------
  // Board code
  //----------------------------------------------------------------------

  // Called when the program is detected or changed. Create new components here.
  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    // Nothing to create! This program controls an existing model Property.
  };

  // Called when the paper positions change.
  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchPad, sharedData ) => {
    
    // Global model for all programs
    const model = sharedData.model;

    if ( model.has( 'volumeProperty' ) ) {
      const volumeProperty = model.get( 'volumeProperty' );
      const range = volumeProperty.range;

      // these values are normalized within the camera window
      const paperWidth = positionPoints[ 2 ].x - positionPoints[ 0 ].x;
      const paperHeight = positionPoints[ 2 ].y - positionPoints[ 0 ].y;
      const area = paperWidth * paperHeight;

      // multiply area by 2 so max value is ~half of the camera window
      const newValue = area * 2 * range.max;
      const constrainedValue = Math.max( Math.min( newValue, range.max ), range.min );
      volumeProperty.value = constrainedValue;
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
  ctx.fillText('Volume', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('Control', canvas.width / 2, canvas.height / 2 + 20);
})();


