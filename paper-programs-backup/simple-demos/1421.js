// Simple PhET Slider
// Keywords: slider, view, control, simple
// ------------------------------- //
// Required Programs (dependencies) [none]
// Recommended Programs (work well with no modifications, but not necessary) [none]

importScripts('paper.js');

(async () => {

  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    if ( scratchpad.slider ) {
      alert( 'There is already a slider!' );
    }
    else {
      // Create a Scenery slider.
      const valueProperty = new phet.axon.Property( 0 );
      const range = new phet.dot.Range( 0, 100 );
      const slider = new phet.sun.HSlider( valueProperty, range, { thumbFill: 'green' } );
      sharedData.scene.addChild( slider );
      scratchpad.slider = slider;
    }
  };

  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchpad, sharedData ) => {
    console.log( 'change position called' );
    if ( scratchpad.slider ){

      // Center the image based on the position of the paper.
      const paperCenterX = ( positionPoints[0].x + positionPoints[1].x ) / 2;
      const paperCenterY = ( positionPoints[0].y + positionPoints[2].y ) / 2;
      scratchpad.slider.centerX = paperCenterX * sharedData.displaySize.width;
      scratchpad.slider.centerY = paperCenterY * sharedData.displaySize.height;
    }
  };

  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    console.log( 'remove called', scratchpad );
    if ( scratchpad.slider ){
      sharedData.scene.removeChild( scratchpad.slider );
      scratchpad.slider = null;
    }
    else{
      alert( 'Error: Slider not found in scratchpad data.' );
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
  ctx.fillText('slider', canvas.width / 2, canvas.height / 2 + 20);

})();

