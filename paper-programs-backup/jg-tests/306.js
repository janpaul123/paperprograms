// Checkbox for VisibleProperty
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
    const model = sharedData.modelProperty.value;

    // Use scene.addChild( someNode ) to draw components in the Board.
    const scene = sharedData.scene;

    // Create your View components here.
    if ( !scratchpad.visibilityCheckbox && model.visibleProperty ) {
        scratchpad.visibilityCheckbox = new phet.sun.Checkbox(
          model.visibleProperty,

          // the visual label - replace with any scenery Node ( text, circle,
          // rectangle, image...)
          new phet.scenery.Text( 'Visible' )
        );

      // Add to the Board
      sharedData.scene.addChild( scratchpad.visibilityCheckbox );

      // position - relative to left top of the board
      scratchpad.visibilityCheckbox.center = new phet.dot.Vector2( 100, 100 );
    }
  };

  const onProgramChangedPosition = ( paperProgramNumber, scratchPad, sharedData ) => {
    
    // Behavior that changes with paper position here.
  };

  // This is tear down code that removes the programs when phyical papers are removed 
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {

    // Remove view components here.
    if ( scratchpad.visibilityCheckbox ) {
        scratchpad.visibilityCheckbox.dispose();
        delete scratchpad.visibilityCheckbox;
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
  ctx.fillText('Create', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('ohmsLawModel', canvas.width / 2, canvas.height / 2 + 20);
})();


