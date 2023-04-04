// Voice Mass Value
// Keywords: density, voicing, view
// ------------------------------- //
// Required Programs (dependencies): Density: Model
// Recommended Programs: Density: Change Mass with Paper Position
// Program Description:

importScripts( 'paper.js' );

( async () => {

  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    // By reusing this Utterance, you will only hear the alert when the mass STOPS changing. You won't hear
    // multiple stale alerts as the value changes rapidly.
    const utterance = new phet.utteranceQueue.Utterance( {

      // This Utterance should not cancel others (like ones speaking about density)
      announcerOptions: {
        cancelOther: false
      }
    } );

    const componentListener = value => {

      // Just read the new mass value, to 1 decimal place.
      const massValue = phet.dot.Utils.toFixed( value, 1 );
      utterance.alert = `New mass value: ${massValue} kilograms`;
      phet.scenery.voicingUtteranceQueue.addToBack( utterance );
    };
    scratchpad.linkId = phet.paperLand.addModelPropertyLink( 'massProperty', componentListener );
  };

  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    phet.paperLand.removeModelPropertyLink( 'massProperty', scratchpad.linkId );
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
  ctx.fillText( 'Mass', canvas.width / 2, canvas.height / 2 + 20 );
} )();

