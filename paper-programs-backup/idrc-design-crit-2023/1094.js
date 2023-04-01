// Density: Voice Volume Value
// Keywords: density, voicing, view
// ------------------------------- //
// Required Programs (dependencies) Density: Model
// Recommended Programs: Density: Change Volume with Paper Area
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
    const propertyName = 'volumeProperty';
    //----------------------------------------------------------------------
    
    // Global model for all programs
    const model = sharedData.model;

    // Adds listeners to the model component when the program is added or when the model
    // Property is added.
    const addComponentListeners = component => {

      const utterance = new phet.utteranceQueue.Utterance( {
        
        // This Utterance should not cancel others (like ones speaking about density)
        announcerOptions: {
          cancelOther: false
        }
      } );

      // This the function to implement to watch the changing Property.
      const componentListener = value => {

        // Just read the new volume value, to 1 decimal place.
        const volumeValue = phet.dot.Utils.toFixed( value, 1 );
        utterance.alert = `New volume value: ${volumeValue} Liters`;
        phet.scenery.voicingUtteranceQueue.addToBack( utterance );
      };
      component.link( componentListener );
      scratchpad[ `componentListener${paperProgramNumber}` ] = componentListener;
    };

    // removes 
    const removeComponentListeners = ( component ) => {
      component.unlink( scratchpad[ `componentListener${paperProgramNumber}` ] );
      delete scratchpad[ `componentListener${paperProgramNumber}` ];
    };

    if ( model.get( propertyName ) ) {

      // Property exists, add view listeners to it
      addComponentListeners( model.get( propertyName ) );
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
    if ( model.has( propertyName ) ) {
      scratchpad[ `removeComponentListeners${paperProgramNumber}`]( model.get( propertyName ) );
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
  ctx.fillText('Volume', canvas.width / 2, canvas.height / 2 + 20);
})();
