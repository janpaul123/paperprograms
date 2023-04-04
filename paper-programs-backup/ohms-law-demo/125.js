// Voltage Slider - view from template  - Copy
// Keywords: slider, number, ohm's law, view, OL

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

    //------------------------------------------------------------------------
    // Template variables

    // REQUIRED! Create a unique name for this slider. WARNING: use this name
    // in the onProgramRemoved too!!
    const uniqueSliderName = 'voltageSlider'; // e.g. voltageSlider

    const modelProperty = model.voltageProperty; // Rename to the model Property you created
    const range = modelProperty.range; // Range of values for the model and slider.
    const voicingNameResponse = 'voltage';

    const sliderKnobColor = 'red';
    const sliderTrackColor = 'blue';
    //------------------------------------------------------------------------

    if ( !modelProperty ) {
      alert( 'No Property for slider, create and add model Program first.' );
    }

    // Use scene.addChild( someNode ) to draw components in the Board.
    const scene = sharedData.scene;

    // Create your View components here.
    const slider = new phet.sun.VSlider( modelProperty, range, {

      // voicing
      voicingNameResponse: voicingNameResponse,
      
      // thumb colors
      thumbFill: sliderKnobColor,
      trackFillEnabled: sliderTrackColor,

      // generate Voicing responses on end drag
      endDrag: () => {

        // Code that is run when after an interaction with the slider
      }
    } );
    scene.addChild( slider );
    scratchpad[ uniqueSliderName ] = slider;

    // Place the slider 
    slider.center = new phet.dot.Vector2( 100, 100 );
  };

  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchpad, sharedData ) => {
    const model = sharedData.model;
    // Behavior that changes with paper position here. This example changes the number value with height
    // of the paper in the camera. Change this if you want to track rotation or something else.

    //------------------------------------------------------------------------
    // Template variables
    const modelProperty = model.voltageProperty; // Rename to the model Property you created
    const range = modelProperty.range; // Range of values for the model and slider.
    //------------------------------------------------------------------------

    if ( modelProperty ) {

      // Set the modelProperty value based on the position of the paper.
      const paperCenterY = ( positionPoints[0].y + positionPoints[2].y ) / 2;
      modelProperty.value = ( 1 - paperCenterY ) * range.max;
    }
  };

  // This is tear down code that removes the programs when phyical papers are removed 
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {

    // Remove view components here.
    const slider = scratchpad[ 'voltageSlider' ]; // replace with uniqueSliderName string above
    if ( slider ) {
      slider.dispose();
      delete scratchpad[ 'voltageSlider' ]; // replace with uniqueSliderName string above
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
  ctx.fillText('Voltage', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('Slider', canvas.width / 2, canvas.height / 2 + 20);
})();



