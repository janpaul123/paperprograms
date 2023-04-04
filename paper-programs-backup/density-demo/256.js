// Voice Density Value
// Keywords: density, voicing, view
// ------------------------------- //
// Required Programs (dependencies) Density: Model
// Recommended Programs: Density prefix
// Program Description:

importScripts( 'paper.js' );

( async () => {

  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    // By reusing this Utterance, it will only speak the alert on the latest value (preventing too many
    // alerts as the value changes quickly).
    const utterance = new phet.utteranceQueue.Utterance( {

      // This utterance should not cancel others
      announcerOptions: {
        cancelOther: false
      }
    } );

    // This the function to implement to watch the changing Property.
    const componentListener = value => {

      // Just read the new density value, to 1 decimal place.
      const densityValue = phet.dot.Utils.toFixed( value, 1 );
      utterance.alert = `Density: ${densityValue} kilograms per Liter.`;
      phet.scenery.voicingUtteranceQueue.addToBack( utterance );
    };
    scratchpad.linkId = phet.paperLand.addModelPropertyLink( 'densityProperty', componentListener );
  };

  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    phet.paperLand.removeModelPropertyLink( 'densityProperty', scratchpad.linkId );
    delete scratchpad.linkId;
  }

  // Add the state change handler defined above as data for this paper.
  await paper.set( 'data', {
    paperPlaygroundData: {
      updateTime: Date.now(),
      eventHandlers: {
        onProgramAdded: onProgramAdded.toString(),
        onProgramRemoved: onProgramRemoved.toString()
      }
    }
  } );

  // Get a canvas object for this paper.
  const canvas = await paper.get( 'canvas' );

  // Draw "Hello world" on the canvas.
  const ctx = canvas.getContext( '2d' );
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(255,0,0)';
  ctx.fillText( 'Voice', canvas.width / 2, canvas.height / 2 - 10 );
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText( 'Density', canvas.width / 2, canvas.height / 2 + 20 );
} )();

