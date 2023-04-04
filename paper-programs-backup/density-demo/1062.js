// Voice Volume Value
// Keywords: density, voicing, view
// ------------------------------- //
// Required Programs (dependencies) Density: Model
// Recommended Programs: Density: Change Volume with Paper Area
// Program Description:

importScripts( 'paper.js' );

( async () => {

  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    const utterance = new phet.utteranceQueue.Utterance( {

      // This Utterance should not cancel others (like ones speaking about density)
      announcerOptions: {
        cancelOther: false
      }
    } );

    // This the function to implement to watch the changing Property.
    const voiceVolume = value => {

      // Just read the new volume value, to 1 decimal place.
      const volumeValue = phet.dot.Utils.toFixed( value, 1 );
      utterance.alert = `New volume value: ${volumeValue} Liters`;
      phet.scenery.voicingUtteranceQueue.addToBack( utterance );
    };
    scratchpad.linkId = phet.paperLand.addModelPropertyLink( 'volumeProperty', voiceVolume );
  };

  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    phet.paperLand.addModelPropertyLink( 'volumeProperty', scratchpad.linkId );
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
  ctx.fillText( 'Volume', canvas.width / 2, canvas.height / 2 + 20 );
} )();

