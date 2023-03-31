// View Template v2
// Keywords: view, link, 
// ------------------------------- //
// Required Programs (dependencies) Altitude: Model
// Recommended Programs (work well with no modifications, but not necessary) [none]
// Program Description:

importScripts('paper.js');

(async () => {

  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    //----------------------------------------------------------------------
    // Template Variables
    //----------------------------------------------------------------------
    const propertyName = 'altitudeProperty';
    //----------------------------------------------------------------------
    
    // Global model for all programs
    const model = sharedData.model;

    // Adds listeners to the model component when the program is added or when the model
    // Property is added.
    const addComponentListeners = component => {

      // This the function to implement to watch the changing Property.
      const componentListener = value => {};
      component.link( componentListener );
      scratchpad[ `componentListener${paperProgramNumber}` ] = componentListener;
    };

    // removes 
    const removeComponentListeners = ( component ) => {
      component.unlink( scratchpad[ `componentListener${paperProgramNumber}` ] );
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
    if ( model[ propertyName ] ) {
      scratchpad[ `removeComponentListeners${paperProgramNumber}`]( model[ propertyName ] );
    }

    phet.paperLand.modelComponentRemovedEmitter.addListener( scratchpad[ `modelAdded${paperProgramNumber}` ] );
    phet.paperLand.modelComponentRemovedEmitter.addListener( scratchpad[ `modelRemoved${paperProgramNumber}` ] );

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
  ctx.fillText('View', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('Component', canvas.width / 2, canvas.height / 2 + 20);
})();
