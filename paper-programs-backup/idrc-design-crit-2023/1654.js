// Density: Volume Slider
// Keywords: slider, number, view, density
// =============================== //
// Program Dependencies: Density: Model
// Recommended Programs: A slider to control Volume in the absence of the area 
// control paper (Density: Change Volume with Paper Area)

importScripts( 'paper.js' );

( async () => {

  //----------------------------------------------------------------------
  // Board code
  //----------------------------------------------------------------------

  // Create view components (graphics, Voicing, sound, anything)
  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    //-------------------------------------------------------------
    // Template variables
    //-------------------------------------------------------------
    const voicingNameResponse = '';

    const sliderKnobColor = 'gold';
    const sliderTrackColor = 'purple';
    //-------------------------------------------------------------

    const model = sharedData.model;
    const scene = sharedData.scene;

    // A function that is called when the volume Property exists or is added to the model
    const handleModelPropertyExists = volumeProperty => {

      // Range of values for the model and slider.
      const range = volumeProperty.range;

      // Create your View components here.
      const slider = new phet.sun.VSlider( volumeProperty, range, {

        // voicing
        voicingNameResponse: voicingNameResponse,

        // thumb colors
        thumbFill: sliderKnobColor,
        trackFillEnabled: sliderTrackColor,

        endDrag: () => {
          // Code that is run when after an interaction with the slider

        }
      } );

      // Place the slider - relative to top left of the Board
      slider.center = new phet.dot.Vector2( 300, 300 );

      // add to the board display
      scene.addChild( slider );

      // save a reference to the slider so we can remove it later
      scratchpad.slider = slider;
    }

    // A function that is called when the volume Property or this program does not exist or is removed from the model
    const handleModelPropertyRemoved = volumeProperty => {
      scene.removeChild( scratchpad.slider );
    };

    // add an observer so the slider is created/destroyed as the volume Property or this program enters/exits the
    // camera detection
    scratchpad.observerId = phet.paperLand.addModelObserver( 'volumeProperty', handleModelPropertyExists, handleModelPropertyRemoved );
  };

  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchpad, sharedData ) => {
    const model = sharedData.model;

    // Behavior that changes with paper position here. This example changes the number value with height
    // of the paper in the camera. Change this if you want to track rotation or something else.
    if ( model.has( 'volumeProperty' ) ) {
      const modelProperty = model.get( 'volumeProperty' );
      const range = modelProperty.range;

      // Set the modelProperty value based on the position of the paper.
      const paperCenterY = ( positionPoints[ 0 ].y + positionPoints[ 2 ].y ) / 2;
      let constrainedValue = Math.min( range.max, ( 1 - paperCenterY ) * range.max );
      constrainedValue = Math.max( range.min, constrainedValue );
      modelProperty.value = constrainedValue;
    }
  };

  // This is tear down code that removes the programs when phyical papers are removed 
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    phet.paperLand.removeModelObserver( 'volumeProperty', scratchpad.observerId );
    delete scratchpad.observerId;
  };

  // Add the state change handler defined above as data for this paper.
  await paper.set( 'data', {
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
  const canvas = await paper.get( 'canvas' );

  // Draw the name of the program on the canvas
  const ctx = canvas.getContext( '2d' );
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(255,0,0)';
  ctx.fillText( 'Volume', canvas.width / 2, canvas.height / 2 - 10 );
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText( 'Slider', canvas.width / 2, canvas.height / 2 + 20 );
} )();


