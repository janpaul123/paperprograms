// Sound Loop Button
// Keywords: TextPushButton, sound, button, loop
// ------------------------------- //
// Required Programs (dependencies) [none]
// Recommended Programs (work well with no modifications, but not necessary) [none]
// Program Description:

// Import API to detect and pass paper markers
importScripts('paper.js');

// Begin program in async
(async () => {

  //----------------------------------------------------------------------------------------------------------
  // Board code
  //----------------------------------------------------------------------------------------------------------

  // Get the paper number of this piece of paper (which should not change).
  const myPaperNumber = await paper.get('number');
 
  // ===== //
  // Called when the program is detected. Creates the button, adds it to the scene, and stores it on the "scratchpad"
  // so that it can be removed later when the program is removed.
  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {
    const voicingNameResponse = 'Push me!';
    const voicingObjectResponse = 'Hello World.'
    const voicingHintResponse = 'Push me to introduce me to the world.';

    let pushCounter = 0;
    const voicingButton = new phet.sun.TextPushButton( voicingNameResponse, {

      // increment pushCounter, use it to update the context response and then speak Voicing responses.
      listener: () => {
        pushCounter++;
        voicingButton.voicingContextResponse = `You pushed me ${pushCounter} ${pushCounter > 1 ? 'times' : 'time'}.`;

        // Voice the object and context responses when you press the button (notice we are clearing the name and hint response)
        voicingButton.voicingSpeakFullResponse( {
          nameResponse: null,
          hintResponse: null
        } );
      },

      // assign Voicing responses to the button
      voicingNameResponse: voicingNameResponse,
      voicingObjectResponse: voicingObjectResponse,
      voicingHintResponse: voicingHintResponse
    } );

    // positioning
    voicingButton.top = 300;
    voicingButton.right = 300;

    // Add it to the Display
    sharedData.scene.addChild( voicingButton );

    // assign it to the scratchpad for removal later
    scratchpad.voicingButton = voicingButton;
  };

  // ===== //
  // Called whenever the paper moves. Updates position in the display.
  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchpad, sharedData ) => {
    console.log( `onProgramChangedPosition called for ppn ${paperProgramNumber}`);

    if ( scratchpad.voicingButton ){

      // Center the image based on the position of the paper.
      const paperCenterX = ( positionPoints[0].x + positionPoints[1].x ) / 2;
      const paperCenterY = ( positionPoints[0].y + positionPoints[2].y ) / 2;
      scratchpad.voicingButton.centerX = paperCenterX * sharedData.displaySize.width;
      scratchpad.voicingButton.centerY = paperCenterY * sharedData.displaySize.height;
    }
  };

  // ===== //
  // Called whenever the paper is no longer detected. Removes the button and cleans up assignments.
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    console.log( `onProgramRemoved called for ppn ${paperProgramNumber}`);
    if ( scratchpad.voicingButton ){
      sharedData.scene.removeChild( scratchpad.voicingButton );
      scratchpad.voicingButton = null;
    }
    else{
      alert( 'Error: voicingButton node not found in scratchpad data.' );
    }
  };
   // ===== //
   // Add the state change handler defined above as data for this paper.
  await paper.set('data', {
    program: null,
    paperPlaygroundData: {
      updateTime: Date.now(),
      eventHandlers: {
        onProgramAdded: onProgramAdded.toString(),
        onProgramChangedPosition: onProgramChangedPosition.toString(),
        onProgramRemoved: onProgramRemoved.toString()
      }
    }
  } );
  // END BOARD CODE // 

  //----------------------------------------------------------------------------------------------------------
  // Projector code
  //----------------------------------------------------------------------------------------------------------

  // Get a canvas object for this paper to draw something to the Projector.
  const canvas = await paper.get('canvas');

  // Draw the name of the program to the projector
  const ctx = canvas.getContext('2d');
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(255,0,0)';
  ctx.fillText('Voicing', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('Button', canvas.width / 2, canvas.height / 2 + 20);
})();
