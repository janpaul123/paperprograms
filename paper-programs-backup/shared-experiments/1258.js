// Voltage Property Slider - Ohm's Law model

importScripts('paper.js');

(async () => {

  const onProgramAdded =  ( paperProgramNumber, scratchpad, sharedData ) => {

    //=================================================================================================================
    // Easily Changed Parameters
    
    // const sliderKnobColor = 'rgb(47, 176, 228)';
    const sliderKnobColor = 'rgb(0, 0, 255)';
    const sliderTrackColor = 'rgb(255, 255, 255)';
    // const sliderTrackColor = 'rgb( 0, 0, 200)';
    
    //=================================================================================================================
    // Safety and error handling
    if ( scratchpad.addVoltageSliderListener ) {
      alert( 'Already a listener to create a new slider!' );
    }
    else {


      // Create a listener that will add the slider whenever the model gets a voltage property.
      scratchpad.addVoltageSliderListener = model => {
        if ( model.voltageProperty ) {

          // variable that keeps track of the previous voltage value to describe how voltage changes
          let oldVoltageValue = model.voltageProperty.value;

          const slider = new phet.sun.VSlider( model.voltageProperty, model.voltageProperty.range, {

            // voicing
            voicingNameResponse: 'Voltage',
            
            // thumb colors
            thumbFill: sliderKnobColor,
            trackFillEnabled: sliderTrackColor,

            // generate Voicing responses on end drag
            endDrag: () => {
              const voltageValue = model.voltageProperty.value;
              const currentValue = model.currentProperty.value;

              // Rounds voltage to whole number (object response)
              let objectResponse = phet.dot.Utils.toFixed(voltageValue,1) + ' volts';
              slider.voicingObjectResponse = objectResponse;
              
              // Create empty string for context response 
              let contextResponse = ''

              // Round value and create string
              //let roundedCurrentValue = dot.Utils.toFixed(currentValue,3) + ' Amps';
              let roundedCurrentValue = phet.dot.Utils.toFixed(currentValue,3) * 1000 + ' milliAmps';
              
              // if current decreases use this context reponse
              if (oldVoltageValue > voltageValue) {
                contextResponse = 'As letter V shrinks, letter I shrinks. Current now, ' + roundedCurrentValue;
              }
              else {
                contextResponse = 'As letter V grows, letter I grows. Current now, ' + roundedCurrentValue;
              }
              slider.voicingContextResponse = contextResponse;

              const valueChanged = oldVoltageValue !== voltageValue;
              console.log( valueChanged, voltageValue, oldVoltageValue );
              slider.voicingSpeakFullResponse( {
                nameResponse: valueChanged ?  null : slider.voicingNameResponse,
                objectResponse: slider.voicingObjectResponse,
                contextResponse: valueChanged ? slider.voicingContextResponse: null
              } );

              oldVoltageValue = voltageValue;
            }
          } );

          scratchpad.voltageSlider = slider;
          // let oldVoltageValue = 0;

          // If the properties change do the work inside this multilink which is give me new ohms and Amps here.
          // axon.Multilink.multilink([model.voltageProperty, model.currentProperty], ( voltageValue, currentValue ) => {
          //   // Rounds voltage to whole number (object response)
          //   let objectResponse = dot.Utils.toFixed(voltageValue,1) + ' volts';
          //      slider.voicingObjectResponse = objectResponse;
            
          //   // Create empty string for context response 
          //   let contextResponse = ''

          //   // Round value and create string
          //   //let roundedCurrentValue = dot.Utils.toFixed(currentValue,3) + ' Amps';
          //    let roundedCurrentValue = dot.Utils.toFixed(currentValue,3) * 1000 + ' milliAmps';
             
          //   // if current decreases use this context reponse
          //   if (oldVoltageValue > voltageValue) {
          //     contextResponse = 'As letter V shrinks, letter I shrinks. Current now, ' + roundedCurrentValue;
          //   }
          //   else {
          //     contextResponse = 'As letter V grows, letter I grows. Current now, ' + roundedCurrentValue;
          //   }
          //   slider.voicingContextResponse = contextResponse;
          //   oldVoltageValue = voltageValue;
          // } );

          sharedData.scene.addChild( slider );

        }
        else {
          // alert( 'The property needed by this slider is not present in the model, so the slider can\'t be added.' );
        }
      };

      sharedData.modelProperty.link( scratchpad.addVoltageSliderListener );
    }
  };

  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchpad, sharedData ) => {
    console.log( `onProgramChangedPosition called for ppn ${paperProgramNumber}`);

    if ( scratchpad.voltageSlider ){

      // Center the image based on the position of the paper.
      const paperCenterX = ( positionPoints[0].x + positionPoints[1].x ) / 2;
      const paperCenterY = ( positionPoints[0].y + positionPoints[2].y ) / 2;
      scratchpad.voltageSlider.centerX = paperCenterX * sharedData.displaySize.width;
      scratchpad.voltageSlider.centerY = paperCenterY * sharedData.displaySize.height;
    }
  };

  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    console.log( `onProgramRemoved called for ppn ${paperProgramNumber}`);
    if ( scratchpad.voltageSlider ){
      sharedData.modelProperty.unlink( scratchpad.addVoltageSliderListener );
      
      sharedData.scene.removeChild( scratchpad.voltageSlider );
      scratchpad.voltageSlider = null;
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
  ctx.fillText( 'Voltage', canvas.width / 2, canvas.height / 2 - 10 );
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText( 'Slider', canvas.width / 2, canvas.height / 2 + 20 );
})();
