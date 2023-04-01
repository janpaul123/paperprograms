// Altitude: Model - Copy
// Keywords: altitude, model, property
// ------------------------------- //
// Required Programs (dependencies) [none]
// Recommended Programs: Altitude prefix
// Program Description: Contains the model properties for Altitude, including range 
// and initial values. You can change whether this paper controls the value directly.

importScripts('paper.js');

(async () => {

  //----------------------------------------------------------------------
  // Board code
  //----------------------------------------------------------------------

  // Get the paper number of this piece of paper (which should not change).
  const myPaperNumber = await paper.get('number');

  // Called when the program is detected or changed.
  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {
    
    // -----------------------------------------------------
    // Template Variables
    // -----------------------------------------------------
    // IMPORTANT! Change this to a unique name that identifies this Property.
    // The name you choose here is how you will refer to this Property in other
    // programs. 
    const propertyName = 'altitudeProperty';

    // Controls how paper motion changes the value.
    // 'linear' - value increases linearly as program moves.
    // 'exponential' - value increases exponentially as program moves.
    // 'inverse' - The value is set like 1/x as the program moves.
    // 'none' - The value does NOT change with the program movement.
    const controlType = 'none';

    // Does the value change when moving the program left/right or up/down? 
    // 'horizontal' - left is min, right is max
    // 'vertical' - bottom is min, top is max
    const controlDirection = 'vertical';

    // range for the value as the program moves.
    const range = new phet.dot.Range( 0, 100 );

    // If true, Text will be drawn to the board to display the value for debugging
    const showText = true;

    // number of decimal places when representing the value
    const decimalPlaces = 0;

    // font size for debugging text to see the value on the Board
    const fontSize = 50;

    // positioning of the debugging text, relative to the top left of the board
    const textLeft = 50;
    const textTop = 50;

    // -----------------------------------------------------
    // Create and add components
    // -----------------------------------------------------

    // Global model for all programs
    const model = sharedData.model;

    // Use scene.addChild( someNode ) to draw components in the Board.
    const scene = sharedData.scene;

    // Create the NumberProperty
    const valueProperty = new phet.axon.NumberProperty( range.min, {
      range: range
    } );
    phet.paperLand.addModelComponent( propertyName, valueProperty );

    // Print the value to the board for debugging
    const valueText = new phet.scenery.Text( '', {
      font: new phet.scenery.Font( { size: fontSize } ),
      leftTop: new phet.dot.Vector2( textLeft, textTop ),
      visible: showText
    } );
    scene.addChild( valueText );

    // update the debugging text when the value changes
    const valueTextListener = value => {
      valueText.string = phet.dot.Utils.toFixed( value, decimalPlaces );
    };
    sharedData.model.get( 'propertyName' ).link( valueTextListener );

    // Put values on the scratchpad so we can use them in the other functions. By appending
    // the program number we reduce the chance of collisions with other programs.
    scratchpad[ `propertyName${paperProgramNumber}` ] = propertyName;
    scratchpad[ `controlType${paperProgramNumber}` ] = controlType;
    scratchpad[ `controlDirection${paperProgramNumber}`] = controlDirection;
    scratchpad[ `showText${paperProgramNumber}`] = showText;
    scratchpad[ `valueText${paperProgramNumber}` ] = valueText;
    scratchpad[ `valueTextListener${paperProgramNumber}` ] = valueTextListener;
  };

  // Called when the paper positions change.
  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchpad, sharedData ) => {
    const propertyName = scratchpad[ `propertyName${paperProgramNumber}` ];
    const controlType = scratchpad[ `controlType${paperProgramNumber}` ];
    const controlDirection = scratchpad[ `controlDirection${paperProgramNumber}` ];

    if ( controlType === 'none' ) {
      return;
    }

    // global model for the board (all )    
    const model = sharedData.model;

    if ( model.has( propertyName ) ) {
      const range = model.get( propertyName ).range;
      const positionDimension = controlDirection === 'horizontal' ? 'x' : 'y';

      // This is the center in x or y dimensions of the paper, normalized from 0 to 1.
      let paperCenterValue = ( positionPoints[ 0 ][ positionDimension ] + positionPoints[ 2 ][ positionDimension] ) / 2;

        // account for origin being at the top
      if ( controlDirection === 'vertical' ) {
        paperCenterValue = 1 - paperCenterValue;
      }

      let calculatedValue = model.get( propertyName ).value;
      if ( controlType === 'linear' ) {
        calculatedValue = paperCenterValue * range.max;
      }
      else if ( controlType === 'exponential' ) {
        calculatedValue = Math.pow( paperCenterValue * Math.sqrt( range.max ), 2 );
      }
      else if ( controlType === 'inverse' ) {

        const scaleFactor = 10; // stretches the curve so you can see the behavior in more space
        calculatedValue = ( 1 / (paperCenterValue / scaleFactor ) ) - scaleFactor;
      }
      else {
        alert( 'Invalid value for controlType' );
      }

      // make sure value is within the range
      const constrainedValue = Math.max( Math.min( calculatedValue, range.max ), range.min );
      model.get( propertyName ).value = constrainedValue
    }
  };

  // Called when the program is changed or no longer detected.
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    const valueTextListenerId = `valueTextListener${paperProgramNumber}`;
    const valueTextId = `valueText${paperProgramNumber}`;
    const propertyNameId = `propertyName${paperProgramNumber}`;

    // Global model for all programs
    const model = sharedData.model;

    // Use scene.removeChild( someNode ) to remove components in the Board.
    const scene = sharedData.scene;

    if ( scratchpad[ valueTextListenerId ] ) {

      // Remove the listener that updates the Text and remove references.
      model.get( scratchpad[ propertyNameId ] ).unlink( scratchpad[ valueTextListenerId ] );
      delete scratchpad[ valueTextListenerId ];
    }
    if ( scratchpad[ propertyNameId ] ) {
      phet.paperLand.removeModelComponent( scratchpad[ propertyNameId ] );
      delete scratchpad[ propertyNameId ];
    }
    if ( scratchpad[ valueTextId ] ) {

      // Remove Text from the view and remove references.
      scene.removeChild( scratchpad[ valueTextId ] );
      delete scratchpad[ valueTextId ];
    }

    // delete the other scratchpad items
    delete scratchpad[ `controlType${paperProgramNumber}` ];
    delete scratchpad[ `controlDirection${paperProgramNumber}`];
    delete scratchpad[ `showText${paperProgramNumber}`];
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
  ctx.fillText('Model', canvas.width / 2, canvas.height / 2 + 20);
})();
