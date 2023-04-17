// Add PhET Checkbox - Copy
// Keywords: checkbox, view, simple, phet
// ------------------------------- //
// Required Programs (dependencies) [none]
// Recommended Programs (work well with no modifications, but not necessary) [none]

importScripts('paper.js');

(async () => {

  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {
    console.log( `onProgramAdded called for ppn ${paperProgramNumber}`);

    // Create a checkbox and add it to the scene.
    const checkBoxLabelText = 'CHECK this out!'
    const fontSize = 16;
    const checkboxLabel = new phet.scenery.Text( checkBoxLabelText, {
      font: new phet.sceneryPhet.PhetFont( fontSize )
    } );
    const booleanProperty = new phet.axon.BooleanProperty( false );
    const checkbox = new phet.sun.Checkbox( booleanProperty, checkboxLabel );
    sharedData.scene.addChild( checkbox );
    scratchpad.checkbox = checkbox;
  };

  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchpad, sharedData ) => {
    console.log( `onProgramChangedPosition called for ppn ${paperProgramNumber}`);

    if ( scratchpad.checkbox ){

      // Center the image based on the position of the paper.
      const paperCenterX = ( positionPoints[0].x + positionPoints[1].x ) / 2;
      const paperCenterY = ( positionPoints[0].y + positionPoints[2].y ) / 2;
      scratchpad.checkbox.centerX = paperCenterX * sharedData.displaySize.width;
      scratchpad.checkbox.centerY = paperCenterY * sharedData.displaySize.height;
    }
  };

  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    console.log( `onProgramRemoved called for ppn ${paperProgramNumber}`);
    if ( scratchpad.checkbox ){
      sharedData.scene.removeChild( scratchpad.checkbox );
      scratchpad.checkbox = null;
    }
    else{
      alert( 'Error: Checkbox node not found in scratchpad data.' );
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

  // Add some text to the canvas.
  const ctx = canvas.getContext('2d');
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(155,25,34)';
  ctx.fillText('PhET', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(155,25,34)';
  ctx.fillText('Checkbox', canvas.width / 2, canvas.height / 2 + 20);
})();


