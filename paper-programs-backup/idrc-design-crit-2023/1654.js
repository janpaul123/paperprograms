// Density: Volume Slider
// Keywords: slider, number, view, density
// =============================== //
// Program Dependencies: Density: Model
// Recommended Programs: A slider to control Volume in the absence of the area 
// control paper (Density: Change Volume with Paper Area)

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

    //------------------------------------------------------------------------
    // Template variables

    // REQUIRED! Create a unique name for this slider. WARNING: use this name
    // in the onProgramRemoved too!!
    const uniqueSliderName = 'volumeSlider'; // e.g. voltageSlider

    const modelProperty = model.volumeProperty; // Rename to the model Property you created
    modelProperty.link(volume => {console.log(volume)})
    const range = modelProperty.range; // Range of values for the model and slider.
    const voicingNameResponse = '';

    const sliderKnobColor = 'gold';
    const sliderTrackColor = 'purple';
    //------------------------------------------------------------------------

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

    // Place the slider - relative to top left of the Board
    slider.center = new phet.dot.Vector2( 300, 300 );
  };

  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchpad, sharedData ) => {
    const model = sharedData.modelProperty.value;
    
    // Behavior that changes with paper position here. This example changes the number value with height
    // of the paper in the camera. Change this if you want to track rotation or something else.

    //------------------------------------------------------------------------
    // Template variables
    const modelProperty = model.volumeProperty; // Rename to the model Property you created
    const range = modelProperty.range; // Range of values for the model and slider.
    //------------------------------------------------------------------------

    if ( modelProperty ) {

      // Set the modelProperty value based on the position of the paper.
      const paperCenterY = ( positionPoints[0].y + positionPoints[2].y ) / 2;
      let constrainedValue = Math.min( range.max, (1 - paperCenterY) * range.max )
      constrainedValue = Math.max( range.min, constrainedValue )
      modelProperty.value = constrainedValue;
    }
  };

  // This is tear down code that removes the programs when phyical papers are removed 
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {

    // Remove view components here.
    const slider = scratchpad[ 'volumeSlider' ]; // replace with uniqueSliderName string above
    if ( slider ) {
      slider.dispose();
      delete scratchpad[ 'volumeSlider' ]; // replace with uniqueSliderName string above
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
  ctx.fillText('Volume', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('Slider', canvas.width / 2, canvas.height / 2 + 20);
})();


