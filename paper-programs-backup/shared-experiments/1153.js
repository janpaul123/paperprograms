// Altitude Property
// Keywords: number, value, linear, exponential, inverse
// This creates a value. Moving the paper from left to right increases the value
// with min at the left and max at the right. Control can be linear or exponential,
// see template variables.

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
    const range = new phet.dot.Range( 0, 10 );

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
    model.altitudeProperty = new phet.axon.NumberProperty( range.min, {
      range: range
    } );

    // Print the value to the board for debugging
    scratchpad.valueText = new phet.scenery.Text( '', {
      font: new phet.scenery.Font( { size: fontSize } ),
      leftTop: new phet.dot.Vector2( textLeft, textTop ),
      visible: showText
    } );
    scene.addChild( scratchpad.valueText );

    // update the debugging text when the value changes
    scratchpad.valueListener = value => {
      scratchpad.valueText.text = phet.dot.Utils.toFixed( value, decimalPlaces );
    };
    model.altitudeProperty.link( scratchpad.valueListener );

    // put values on the scratchpad so we can use them in the other functions
    scratchpad.valueControlType = controlType;
    scratchpad.valueControlDirection = controlDirection;
    scratchpad.valueShowText = showText;
  };

  // Called when the paper positions change.
  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchpad, sharedData ) => {

    if ( scratchpad.valueControlType === 'none' ) {
      return;
    }

    // global model for the board (all )    
    const model = sharedData.model;

    if ( model.altitudeProperty ) {
      const range = model.altitudeProperty.range;
      const positionDimension = scratchpad.valueControlDirection === 'horizontal' ? 'x' : 'y';

      // This is the center in x or y dimensions of the paper, normalized from 0 to 1.
      let paperCenterValue = ( positionPoints[ 0 ][ positionDimension ] + positionPoints[ 2 ][ positionDimension] ) / 2;

        // account for origin being at the top
      if ( scratchpad.valueControlDirection === 'horizontal' ) {
        paperCenterValue = 1 - paperCenterValue;
      }

      let calculatedValue = model.altitudeProperty.value;
      if ( scratchpad.valueControlType === 'linear' ) {
        calculatedValue = paperCenterValue * range.max;
      }
      else if ( scratchpad.valueControlType === 'exponential' ) {
        calculatedValue = Math.pow( paperCenterValue * Math.sqrt( range.max ), 2 );
      }
      else if ( scratchpad.valueControlType === 'inverse' ) {

        const scaleFactor = 10; // stretches the curve so you can see the behavior in more space
        calculatedValue = ( 1 / (paperCenterValue / scaleFactor ) ) - scaleFactor;
      }
      else {
        alert( 'Invalid value for controlType' );
      }

      // make sure value is within the range
      const constrainedValue = Math.max( Math.min( calculatedValue, range.max ), range.min );
      model.altitudeProperty.value = constrainedValue
    }
  };

  // Called when the program is changed or no longer detected.
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {

    // Global model for all programs
    const model = sharedData.model;

    // Use scene.removeChild( someNode ) to remove components in the Board.
    const scene = sharedData.scene;

    if ( scratchpad.valueListener ) {

      // Remove the listener that updates the Text and remove references.
      model.altitudeProperty.unlink( scratchpad.valueListener );
      delete scratchpad.valueListener;
    }
    if ( model.altitudeProperty ) {

      // Dispose of the model Property and remove references.
      model.altitudeProperty.dispose();
      delete model.altitudeProperty;
    }
    if ( scratchpad.valueText ) {

      // Remove Text from the view and remove references.
      scene.removeChild( scratchpad.valueText );
      delete scratchpad.valueText;
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

  // Get a canvas object for this paper.
  const canvas = await paper.get('canvas');

  // Draw the name of the program on the canvas
  const ctx = canvas.getContext('2d');
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(255,0,0)';
  ctx.fillText('Linear', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('Value', canvas.width / 2, canvas.height / 2 + 20);
})();




