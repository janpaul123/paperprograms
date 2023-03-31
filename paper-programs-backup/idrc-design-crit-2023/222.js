// Density: Model
// Keywords: density, model
// ------------------------------- //
// Required Programs (dependencies): [none]
// Recommended Programs: Density prefix
// Program Description:

importScripts('paper.js');

(async () => {


  //-------------------------------------------------------------------
  // Projector code
  //-------------------------------------------------------------------
  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    // Global model for all programs
    const model = sharedData.model;

    const massProperty = new phet.axon.NumberProperty( 5, {
      range: new phet.dot.Range( 1, 10 )
    } );

    const volumeProperty = new phet.axon.NumberProperty( 2, {
      range: new phet.dot.Range( 1, 5 )
    } );

    // When true, density is directly controlled by another program instead of derived
    // from mass and volume.
    const controlDensityDirectlyProperty = new phet.axon.BooleanProperty( false );

    const densityRange = new phet.dot.Range(
      massProperty.range.min / volumeProperty.range.max, // minimum value from provided ranges
      massProperty.range.max / volumeProperty.range.min, // maximum value from provided ranges
    );

    // Manually controlled value for density (ignoring mass and volume)
    const controlledDensityProperty = new phet.axon.NumberProperty( massProperty.value / volumeProperty.value, {
      range: densityRange
    } );

    // Derived by mass, volume, OR whether the density control program is in view.
    const densityProperty = new phet.axon.DerivedProperty(
      [ massProperty, volumeProperty, controlDensityDirectlyProperty, controlledDensityProperty ],
      ( mass, volume, controlDensityDirectly, controlledDensity ) => {

        if ( controlDensityDirectly ) {

          // The program controlling density will have its own value, get it and return.
          return controlledDensity;
        }
        else {
          return mass / volume;
        }
      }
    )

    phet.paperLand.addModelComponent( 'massProperty', massProperty );
    phet.paperLand.addModelComponent( 'volumeProperty', volumeProperty );
    phet.paperLand.addModelComponent( 'controlDensityDirectlyProperty', controlDensityDirectlyProperty );
    phet.paperLand.addModelComponent( 'controlledDensityProperty', controlledDensityProperty );
    phet.paperLand.addModelComponent( 'densityProperty', densityProperty );
    phet.paperLand.addModelComponent( 'densityRange', densityRange );
  };

  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {

    // removeModelComponent removes from the global model and disposes
    phet.paperLand.removeModelComponent( 'massProperty' );
    phet.paperLand.removeModelComponent( 'volumeProperty' );
    phet.paperLand.removeModelComponent( 'controlDensityDirectlyProperty' );
    phet.paperLand.removeModelComponent( 'controlledDensityProperty' );
    phet.paperLand.removeModelComponent( 'densityProperty' );
    phet.paperLand.removeModelComponent( 'densityRange' );
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

  // Draw "Hello world" on the canvas.
  const ctx = canvas.getContext('2d');
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(255,0,0)';
  ctx.fillText('Density', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('Model', canvas.width / 2, canvas.height / 2 + 20);
})();
