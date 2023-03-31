// View Template
// Keywords: view

importScripts('paper.js');

(async () => {

  //----------------------------------------------------------------------
  // Board code
  //----------------------------------------------------------------------

  // Get the paper number of this piece of paper (which should not change).
  const myPaperNumber = await paper.get('number');

  // Create view components (graphics, Voicing, sound, anything)
  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    // Global model for all programs
    const model = sharedData.model;

    // Use scene.addChild( someNode ) to draw components in the Board.
    const scene = sharedData.scene;

    // Create your View components here.
  };

  const onProgramChangedPosition = ( paperProgramNumber, scratchPad, sharedData ) => {
    
    // Behavior that changes with paper position here.
  };

  // This is tear down code that removes the programs when phyical papers are removed 
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {

    // Remove view components here.
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
  ctx.fillText('Create', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('ohmsLawModel', canvas.width / 2, canvas.height / 2 + 20);
})();

