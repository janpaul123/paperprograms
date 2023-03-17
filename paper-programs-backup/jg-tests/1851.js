// Checkbox - single program
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

    // Create your components here!
    // Create a boolean value (model) for the checkbox to control.
    if ( !model.checkedProperty ) {
          
      // Creates model properties, using axon because it has capabilities for dynmaic behaviour
      model.checkedProperty = new phet.axon.BooleanProperty(
        false // initial value
      );
    }

    // Create a checkbox to control the value.
    if ( !scratchpad.checkedCheckbox && model.checkedProperty ) {
      scratchpad.checkedCheckbox = new phet.sun.Checkbox(
          model.checkedProperty,

          // the visual label - replace with any scenery Node ( text, circle,
          // rectangle, image...)
          new phet.scenery.Text( 'Check me!' )
      );

      // Add to the Board
      sharedData.scene.addChild( scratchpad.checkedCheckbox );

      // position - relative to left top of the board
      scratchpad.checkedCheckbox.center = new dot.Vector2( 100, 100 );
    }

    // When paper is added:
    // Do something with the changing value.
    if ( model.checkedProperty ) {

      // RENAME checkedPropertyListener TO MATCH checkedProperty!
      scratchpad.checkedPropertyListener = newValue => {

        const myUtterance = new phet.utteranceQueue.Utterance( {
          priority: 5 // higher priority cancels lower priority speech
        } );
        myUtterance.alert = 'I am checked: ' + newValue;
        scenery.voicingUtteranceQueue.addToBack( myUtterance );
      }
      model.checkedProperty.link( scratchpad.checkedPropertyListener );
    }
  };

  const onProgramChangedPosition = ( paperProgramNumber, scratchPad, sharedData ) => {
    
    // Behavior that changes with paper position here.
  };

  // This is tear down code that removes the programs when phyical papers are removed 
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {

    // Global model for all programs
    const model = sharedData.modelProperty.value;

    // Use scene.addChild( someNode ) to draw components in the Board.
    const scene = sharedData.scene;

    // Remove view components here.
    if ( model.checkedProperty && scratchpad.checkedPropertyListener ) {
        model.checkedProperty.link( scratchpad.checkedPropertyListener );
    }

    if ( model.checkedProperty ) {
        model.checkedProperty.dispose();
        delete model.checkedProperty;
    }

    if ( scratchpad.checkedCheckbox ) {
        scratchpad.checkedCheckbox.dispose();
        delete scratchpad.checkedCheckbox;
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


