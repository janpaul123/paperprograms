// Density: Change Density w/ Paper Position
// Keywords: density, model, paperPosition
// ------------------------------- //
// Required Programs (dependencies) Density: Model
// Recommended Programs: Density prefix
// Program Description:

importScripts('paper.js');

(async () => {

  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    // Whenever the 'controlsDensityDirectlyProperty' exists in the model, it will be set to "true" by this controller.
    const controllerAttach = component => component.value = true;
    const controllerDetach = component => component.value = false;
    scratchpad.controllerId = phet.paperLand.addModelController( 'controlDensityDirectlyProperty', controllerAttach, controllerDetach );
  };

  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {

    // stop controlling the model Property
    phet.paperLand.removeModelController( 'controlDensityDirectlyProperty', scratchpad.controllerId );
    delete scratchpad.controllerId;
  }

  // Called when the paper positions change.
  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchPad, sharedData ) => {
    
    // Global model for all programs
    const model = sharedData.model;

    if ( model.has( 'controlledDensityProperty' ) ) {
      const controlledDensityProperty = model.get( 'controlledDensityProperty' );
      const range = controlledDensityProperty.range;

      // This is the center in x or y dimensions of the paper, normalized from 0 to 1.
      // Graphics coordinate system has 0 at top so subtract from 1 so that 0 is at the bottom.
      let paperCenterY = 1 - ( positionPoints[ 0 ].y + positionPoints[ 2 ].y ) / 2;
      const newValue = paperCenterY * range.max;

      // make sure value is within the range
      const constrainedValue = Math.max( Math.min( newValue, range.max ), range.min );
      controlledDensityProperty.value = constrainedValue;
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

  // Draw "Hello world" on the canvas.
  const ctx = canvas.getContext('2d');
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(255,0,0)';
  ctx.fillText('Control', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('Density', canvas.width / 2, canvas.height / 2 + 20);
})();
