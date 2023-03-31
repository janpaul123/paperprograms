// altitudeProperty Slider

importScripts('paper.js');

(async () => {

  const onProgramAdded =  ( paperProgramNumber, scratchpad, sharedData ) => {

    //=================================================================================================================
    // Easily Changed Parameters
    
    // const sliderKnobColor = 'rgb(47, 176, 228)';
    const sliderKnobColor = 'rgb(200, 0, 0)';
    const sliderTrackColor = 'rgb(255, 255, 255)';
    // const sliderTrackColor = 'rgb( 0, 0, 200)';
    
    //=================================================================================================================

    if ( scratchpad.addAltitudeSliderListener ) {
      alert( 'Already a listener to create a new slider!' );
    }
    else {
      scratchpad.addAltitudeSliderListener = model => {
        if ( model.altitudeProperty ) {
          const altitudeRange = new phet.dot.Range( 0, 10 );
          const slider = new phet.sun.VSlider( model.altitudeProperty, altitudeRange, {
            thumbFill: sliderKnobColor,
            trackFillEnabled: sliderTrackColor
          } );

          scratchpad.slider = slider;

          model.altitudeProperty.link( newValue => {
            let contextResponse = '';
            if ( newValue > 7 ) {
              contextResponse = 'altitude high';
            }
            else if ( newValue > 3 ) {
              contextResponse = 'altitude medium';
            }
            else {
              contextResponse = 'altitude low';
            }

            slider.voicingContextResponse = contextResponse;
          } );

          sharedData.scene.addChild( slider );

        }
        else {
          alert( 'The property needed by this slider is not present in the model, so the slider can\'t be added.' );
        }
      };

      phet.paperLand.modelComponentAddedEmitter( scratchpad.addAltitudeSliderListener );
    }
  };

  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchpad, sharedData ) => {
    console.log( `onProgramChangedPosition called for ppn ${paperProgramNumber}`);

    if ( scratchpad.slider ){

      // Center the slider based on the position of the paper.
      const paperCenterX = ( positionPoints[0].x + positionPoints[1].x ) / 2;
      const paperCenterY = ( positionPoints[0].y + positionPoints[2].y ) / 2;
      scratchpad.slider.centerX = paperCenterX * sharedData.displaySize.width;
      scratchpad.slider.centerY = paperCenterY * sharedData.displaySize.height;
    }
  };

  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    console.log( `onProgramRemoved called for ppn ${paperProgramNumber}`);
    if ( scratchpad.slider ){
      sharedData.phet.paperLand.modelComponentAddedEmitter.removeListener( scratchpad.addAltitudeSliderListener );
      
      sharedData.scene.removeChild( scratchpad.slider );
      scratchpad.slider = null;
    }
    else{
      alert( 'Error: Slider node not found in scratchpad data.' );
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

    // Get a canvas object for this paper.
  const canvas = await paper.get('canvas');

  // Draw a message on the canvas.
  const ctx = canvas.getContext('2d');
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(255,0,0)';
  ctx.fillText( 'Altitude', canvas.width / 2, canvas.height / 2 - 10 );
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText( 'Slider', canvas.width / 2, canvas.height / 2 + 20 );
})();
