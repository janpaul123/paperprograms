// Sound Button
// Keywords: sound, button, helloworld
// ------------------------------- //
// Required Programs (dependencies) [none]
// Recommended Programs (work well with no modifications, but not necessary) [none]

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
    
    const wrappedAudioBuffer = createAndLoadWrappedAudioBuffer( 'media/sounds/loonCall.mp3' );
    debugger
    const soundClip = new phet.tambo.SoundClip( wrappedAudioBuffer );
    tambo.soundManager.addSoundGenerator( soundClip );
 
    // Assign the sound to the scratchpad so that we can remove it later
    scratchpad.soundClip = soundClip;

    // JG: There is a syntax error here so I commented this out for now.
    // const soundButton = new phet.sun.TextPushButton( soundClip, {
    //   setTimeout( () => {
    //     soundClip.play();
    //     console.log( 'Just played sound clip, did you hear it?' );
    //   }, 1000 );
    // } );

    // positioning
    soundButton.top = 300;
    soundButton.right = 300;

    // Add it to the Display
    sharedData.scene.addChild( soundButton );

    // assign it to the scratchpad for removal later
    scratchpad.soundButton = soundButton;
  };

  // ===== //
  // Called whenever the paper moves. Updates position in the display.
  // const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchpad, sharedData ) => {
  //   console.log( `onProgramChangedPosition called for ppn ${paperProgramNumber}`);

  //   if ( scratchpad.soundButton ){

  //     // Center the image based on the position of the paper.
  //     const paperCenterX = ( positionPoints[0].x + positionPoints[1].x ) / 2;
  //     const paperCenterY = ( positionPoints[0].y + positionPoints[2].y ) / 2;
  //     scratchpad.soundButton.centerX = paperCenterX * sharedData.displaySize.width;
  //     scratchpad.soundButton.centerY = paperCenterY * sharedData.displaySize.height;
  //   }
  // };

  // ===== //
  // Called whenever the paper is no longer detected. Removes the button and cleans up assignments.
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    console.log( `onProgramRemoved called for ppn ${paperProgramNumber}`);
    
    tambo.soundManager.removeSoundGenerator( scratchpad.soundClip );
    scratchpad.soundClip = null;
    
    if ( scratchpad.soundButton ){
      sharedData.scene.removeChild( scratchpad.soundButton );
      scratchpad.soundButton = null;
    }
    else{
      alert( 'Error: soundButton node not found in scratchpad data.' );
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
  ctx.fillText('389 Sound', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('Button', canvas.width / 2, canvas.height / 2 + 20);
})();