// Density: Change Density w/ Paper Position
// Keywords: density, model, paperPosition
// ------------------------------- //
// Required Programs (dependencies) Density: Model
// Recommended Programs: Density prefix
// Program Description:

importScripts('paper.js');

(async () => {

  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    //----------------------------------------------------------------------
    // Template Variables
    //----------------------------------------------------------------------
    const propertyName = 'controlDensityDirectlyProperty';
    //----------------------------------------------------------------------
    
    // Global model for all programs
    const model = sharedData.model;

    if ( model.has( propertyName ) ) {

      // Property exists, set it to true so this program controls density directly
      model.get( propertyName ).value = true;
    }
    const modelAddedListener = ( componentName, component ) => {

      // Property was added after this one, set it to true when it becomes 
      // available
      if ( componentName === propertyName ) {
        component.value = true;
      }
    };
    phet.paperLand.modelComponentAddedEmitter.addListener( modelAddedListener );

    const modelRemovedListener = ( componentName, component ) => {

      // Property was removed before this one, set to false
      // (In this case this is probably unecessary because the density Property
      // is being removed entirely)
      if ( componentName === propertyName ) {
        component.value = false;
      }
    };
    phet.paperLand.modelComponentRemovedEmitter.addListener( modelRemovedListener );

    // assign components to the scratchpad so that they can be removed later
    scratchpad[ `modelAdded${paperProgramNumber}` ] = modelAddedListener;
    scratchpad[ `modelRemoved${paperProgramNumber}` ] = modelRemovedListener;
    scratchpad[ `propertyName${paperProgramNumber}` ] = propertyName;
  };

  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {

    // Global model for all programs
    const model = sharedData.model;

    const propertyName = scratchpad[ `propertyName${paperProgramNumber}` ];
    if ( model.has( propertyName ) ) {

      // Nothing to unlink, but when this program is removed, the 
      // Property for controlling density directly should be set to false.
      model.get( propertyName ).value = false;
    }

    phet.paperLand.modelComponentAddedEmitter.removeListener( scratchpad[ `modelAdded${paperProgramNumber}` ] );
    phet.paperLand.modelComponentRemovedEmitter.removeListener( scratchpad[ `modelRemoved${paperProgramNumber}` ] );

    delete scratchpad[ `modelAdded${paperProgramNumber}` ];
    delete scratchpad[ `modelRemoved${paperProgramNumber}` ];
    delete scratchpad[ `propertyName${paperProgramNumber}` ];
  }

  // Called when the paper positions change.
  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchPad, sharedData ) => {
    
    // Global model for all programs
    const model = sharedData.model;

    if ( model.controlledDensityProperty ) {
      const range = model.controlledDensityProperty.range;

      // This is the center in x or y dimensions of the paper, normalized from 0 to 1.
      // Graphics coordinate system has 0 at top so subtract from 1 so that 0 is at the bottom.
      let paperCenterY = 1 - ( positionPoints[ 0 ].y + positionPoints[ 2 ].y ) / 2;
      const newValue = paperCenterY * range.max;

      // make sure value is within the range
      const constrainedValue = Math.max( Math.min( newValue, range.max ), range.min );
      model.controlledDensityProperty.value = constrainedValue;
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
