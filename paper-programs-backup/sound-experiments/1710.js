// Test Sound Clip

importScripts('paper.js');

(async () => {

  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    const wrappedAudioBuffer = createAndLoadWrappedAudioBuffer( 'media/sounds/loonCall.mp3' );

    const soundClip = new phet.tambo.SoundClip( wrappedAudioBuffer );
    phet.tambo.soundManager.addSoundGenerator( soundClip );
    setTimeout( () => {
      soundClip.play();
      console.log( 'Just played sound clip, did you hear it?' );
    }, 1000 );
    
    // Assign the sound to the scratchpad so that we can remove it later
    scratchpad.soundClip = soundClip;
  };
 
  // Called when the program is removed.
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    phet.tambo.soundManager.removeSoundGenerator( scratchpad.soundClip );
    scratchpad.soundClip = null;
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

  // Add text to the canvas.
  const ctx = canvas.getContext('2d');
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(255,0,0)';
  ctx.fillText('Test', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('Sound', canvas.width / 2, canvas.height / 2 + 20);
})();
