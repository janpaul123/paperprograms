// Density: Voice Density Value
// Keywords: density, voicing, view
// ------------------------------- //
// Required Programs (dependencies) Density: Model
// Recommended Programs: Density prefix
// Program Description:

importScripts('paper.js');

(async () => {

  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    //----------------------------------------------------------------------
    // Template Variables
    //----------------------------------------------------------------------
    // The model Property that this component is going to observe.
    // By defining here, this template can add boilerplate code
    // to nicely handle adding this program before or after the 
    // model Property exists.
    const propertyName = 'densityProperty';
    //----------------------------------------------------------------------
    
    // Global model for all programs
    const model = sharedData.model;

    // Adds listeners to the model component when the program is added or when the model
    // Property is added.
    const addComponentListeners = component => {

      const utterance = new phet.utteranceQueue.Utterance( {
        
        // This utterance should not cancel others
        announcerOptions: {
          cancelOther: false
        }
      } );

      // This the function to implement to watch the changing Property.
      const componentListener = value => {

        // Just read the new density value, to 1 decimal place.
        const densityValue = phet.dot.Utils.toFixed( value, 1 );
        utterance.alert = `Density: ${densityValue} kilograms per Liter.`;
        phet.scenery.voicingUtteranceQueue.addToBack( utterance );
      };

      if ( scratchpad[ `componentListener${paperProgramNumber}` ] ) {
        throw new Error( 'There is already a listener on the scratchpad' );
      }
      else {
        scratchpad[ `componentListener${paperProgramNumber}` ] = componentListener;
        component.link( componentListener );
      }
    };

    // removes 
    const removeComponentListeners = ( component ) => {
      const beforeListenerCount = component.getListenerCount();
      component.unlink( scratchpad[ `componentListener${paperProgramNumber}` ] );

      if ( beforeListenerCount === component.getListenerCount() ) {
        throw new Error( 'A listener was NOT removed' );
      }

      delete scratchpad[ `componentListener${paperProgramNumber}` ];
    };

    if ( model[ propertyName ] ) {

      // Property exists, add view listeners to it
      addComponentListeners( model[ propertyName ] );
    }
    const modelAddedListener = ( componentName, component ) => {

      // Property was added after this one, add listeners to it
      if ( componentName === propertyName ) {
        addComponentListeners( component );
      }
    };
    phet.paperLand.modelComponentAddedEmitter.addListener( modelAddedListener );

    const modelRemovedListener = ( componentName, component ) => {

      // Property was removed before this one, remove listeners
      if ( componentName === propertyName ) {
        removeComponentListeners( component );
      }
    };
    phet.paperLand.modelComponentRemovedEmitter.addListener( modelRemovedListener );

    // assign components to the scratchpad so that they can be removed later
    scratchpad[ `modelAdded${paperProgramNumber}` ] = modelAddedListener;
    scratchpad[ `modelRemoved${paperProgramNumber}` ] = modelRemovedListener;
    scratchpad[ `removeComponentListeners${paperProgramNumber}`] = removeComponentListeners;
    scratchpad[ `propertyName${paperProgramNumber}` ] = propertyName;
  };

  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {

    // Global model for all programs
    const model = sharedData.model;

    const propertyName = scratchpad[ `propertyName${paperProgramNumber}` ];
    const removalListener = scratchpad[ `removeComponentListeners${paperProgramNumber}`];
    if ( model[ propertyName ] ) {
      removalListener( model[ propertyName ] );
    }

    phet.paperLand.modelComponentAddedEmitter.removeListener( scratchpad[ `modelAdded${paperProgramNumber}` ] );
    phet.paperLand.modelComponentRemovedEmitter.removeListener( scratchpad[ `modelRemoved${paperProgramNumber}` ] );

    delete scratchpad[ `modelAdded${paperProgramNumber}` ];
    delete scratchpad[ `modelRemoved${paperProgramNumber}` ];
    delete scratchpad[ `removeComponentListeners${paperProgramNumber}`];
    delete scratchpad[ `propertyName${paperProgramNumber}` ];
  }

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

  // Draw "Hello world" on the canvas.
  const ctx = canvas.getContext('2d');
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(255,0,0)';
  ctx.fillText('Voice', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('Density', canvas.width / 2, canvas.height / 2 + 20);
})();
