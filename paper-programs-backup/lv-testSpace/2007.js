// Altitude: Image Y-Position mapped to Altitude - Copy
// Keywords: altitude, image, asset, view
// ------------------------------- //
// Required Programs (dependencies) Altitude: Model
// Recommended Programs: Altitude prefix
// Program Description:

importScripts('paper.js');

(async () => {

  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    //----------------------------------------------------------------------
    // Template Variables
    //----------------------------------------------------------------------
    const propertyName = 'altitudeProperty';

    const imageWidthInPixels = 50; // Must be positive.

    const imageFile = 'girlInAir.png';
    // const imageFile = 'lunarLander.png';
    // const imageFile = 'birdInAir.png';

    //----------------------------------------------------------------------
    
    // Global model for all programs
    const model = sharedData.model;

    const imageElement = document.createElement( 'img' );
    imageElement.setAttribute( 'src', `media/images/${imageFile}` );
    const imageNode = new phet.scenery.Image( imageElement, {
      minWidth: imageWidthInPixels,
      maxWidth: imageWidthInPixels
    } );

    sharedData.scene.addChild( imageNode );

    // Adds listeners to the model component when the program is added or when the model
    // Property is added.
    const addComponentListeners = component => {

      // This the function to implement to watch the changing Property.
      const componentListener = value => {
        const viewAltitude =  sharedData.displaySize.height * ( 1 - value / component.range.max );
        imageNode.centerY = viewAltitude;
        imageNode.centerX = sharedData.displaySize.width / 2;
      }

      component.link( componentListener );
      scratchpad[ `componentListener${paperProgramNumber}` ] = componentListener;
    };

    // removes 
    const removeComponentListeners = ( component ) => {
      component.unlink( scratchpad[ `componentListener${paperProgramNumber}` ] );
      delete scratchpad[ `componentListener${paperProgramNumber}` ];
    };

    if ( model.has( propertyName ) ) {

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
    scratchpad[ `imageNode${paperProgramNumber}`] = imageNode;
  };

  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {

    // Global model for all programs
    const model = sharedData.model;

    const propertyName = scratchpad[ `propertyName${paperProgramNumber}` ];
    if ( model.has( propertyName ) ) {
      scratchpad[ `removeComponentListeners${paperProgramNumber}`]( model.get( propertyName ) );
    }

    sharedData.scene.removeChild( scratchpad[ `imageNode${paperProgramNumber}` ] );

    delete scratchpad[ `modelAdded${paperProgramNumber}` ];
    delete scratchpad[ `modelRemoved${paperProgramNumber}` ];
    delete scratchpad[ `removeComponentListeners${paperProgramNumber}`];
    delete scratchpad[ `propertyName${paperProgramNumber}` ];
    delete scratchpad[ `imageNode${paperProgramNumber}` ];
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
  ctx.fillText('Altitude', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('Image', canvas.width / 2, canvas.height / 2 + 20);
})();

