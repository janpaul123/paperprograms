// Resistance Property Slider - Ohm's law Model - Copy

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
    // Safety and error handling
    if ( scratchpad.addResistanceSliderListener ) {
      alert( 'Already a listener to create a new slider!' );
    }
    else {

      // Create a listener that will add the slider whenever the model gets a resistance property.
      scratchpad.addResistanceSliderListener = model => {
        if ( model.resistanceProperty ) {

          // variable that keeps track of the previous resistance value to describe how resistance changes
          let oldResistanceValue = model.resistanceProperty.value;

          const slider = new phet.sun.VSlider( model.resistanceProperty, model.resistanceProperty.range, {
            // voicing
            voicingNameResponse: 'Resistance',

            thumbFill: sliderKnobColor,
            trackFillEnabled: sliderTrackColor,

            // generate Voicing responses on end drag
            endDrag: () => {
              const resistanceValue = model.resistanceProperty.value;
              const currentValue = model.currentProperty.value;

               let objectResponse = phet.dot.Utils.toFixed(resistanceValue,0) + ' ohms';
               slider.voicingObjectResponse = objectResponse;
            
              // Create empty string for context response 
              let contextResponse = ''

              // Round value and create string
              let roundedCurrentValue = phet.dot.Utils.toFixed(currentValue,3) * 1000 + ' milliAmps';
              
              // if resistance decreases use this context reponse
              if (oldResistanceValue > resistanceValue) {
              contextResponse = 'As letter R shrinks, letter I grows. Current now, ' + roundedCurrentValue;
              }
              else {
              contextResponse = 'As letter R grows, letter I shrinks. Current now, ' + roundedCurrentValue;
              }
              slider.voicingContextResponse = contextResponse;
              
              const valueChanged = oldResistanceValue !== resistanceValue;
              console.log( valueChanged, resistanceValue, oldResistanceValue );
              slider.voicingSpeakFullResponse( {
                nameResponse: valueChanged ?  null : slider.voicingNameResponse,
                objectResponse: slider.voicingObjectResponse,
                contextResponse: valueChanged ? slider.voicingContextResponse: null
              } );

              oldResistanceValue = resistanceValue;
              }
          } );

          scratchpad.slider = slider;
          // let oldResistanceValue = 0;

          // If the properties change do the work inside this multilink which is give me new ohms and Amps here.
          //axon.Multilink.multilink([model.resistanceProperty, model.currentProperty], ( resistanceValue, currentValue ) => {
            // Rounds resistance to whole number (object response)
            //let objectResponse = dot.Utils.toFixed(resistanceValue,0) + ' ohms';
               //slider.voicingObjectResponse = objectResponse;
            
            // Create empty string for context response 
            //let contextResponse = ''

            // Round value and create string
            // let roundedCurrentValue = dot.Utils.toFixed(currentValue,3) + ' Amps';
            //let roundedCurrentValue = dot.Utils.toFixed(currentValue,3) * 1000 + ' milliAmps';
            // if current decreases use this context reponse
          //   if (oldResistanceValue > resistanceValue) {
          //     contextResponse = 'As letter R shrinks, letter I grows. Current now, ' + roundedCurrentValue;
          //   }
          //   else {
          //     contextResponse = 'As letter R grows, letter I shrinks. Current now, ' + roundedCurrentValue;
          //   }
          //   slider.voicingContextResponse = contextResponse;
          //   oldResistanceValue = resistanceValue;
          // } );

          sharedData.scene.addChild( slider );

        }
        else {
          // alert( 'The property needed by this slider is not present in the model, so the slider can\'t be added.' );
        }
      };

      phet.paperLand.modelComponentAddedEmitter( scratchpad.addResistanceSliderListener );
    }
  };

  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchpad, sharedData ) => {
    console.log( `onProgramChangedPosition called for ppn ${paperProgramNumber}`);

    if ( scratchpad.slider ){

      // Center the image based on the position of the paper.
      const paperCenterX = ( positionPoints[0].x + positionPoints[1].x ) / 2;
      const paperCenterY = ( positionPoints[0].y + positionPoints[2].y ) / 2;
      scratchpad.slider.centerX = paperCenterX * sharedData.displaySize.width;
      scratchpad.slider.centerY = paperCenterY * sharedData.displaySize.height;
    }
  };

  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    console.log( `onProgramRemoved called for ppn ${paperProgramNumber}`);
    if ( scratchpad.slider ){
      sharedData.phet.paperLand.modelComponentAddedEmitter.removeListener( scratchpad.addResistanceSliderListener );
      
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
  ctx.fillText( 'Resistance', canvas.width / 2, canvas.height / 2 - 10 );
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText( 'Slider', canvas.width / 2, canvas.height / 2 + 20 );
})();

