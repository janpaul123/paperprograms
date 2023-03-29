// Density: Image Transparency Density Map
// Keywords: density, image, asset, view
// ------------------------------- //
// Required Programs (dependencies): Density: Model
// Recommended Programs: Density prefix
// Program Description:

importScripts('paper.js');

(async () => {

  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    //----------------------------------------------------------------------
    // Template Variables
    //----------------------------------------------------------------------
    const propertyName = 'densityProperty';
    //----------------------------------------------------------------------
    
    // Global model for all programs
    const model = sharedData.modelProperty.value;

    // Create a Scenery image node.
    const imageElement = document.createElement( 'img' );
    imageElement.setAttribute( 'src', 'media/images/barrel.png' );
    const imageNode = new phet.scenery.Image( imageElement, {
      minWidth: 150,
      maxWidth: 150,
      center: new phet.dot.Vector2( 300, 150 )
    } );
    scratchpad[ `imageNode${paperProgramNumber}` ] = imageNode;
    sharedData.scene.addChild( imageNode );

    // Adds listeners to the model component when the program is added or when the model
    // Property is added.
    const addComponentListener = component => {

      // This the function to implement to watch the changing Property.
      const componentListener = value => {
        if ( model.densityRange === undefined ) {
          alert( model.densityRange, 'A range for density is required for this image component.' );
        }

        imageNode.opacity = Math.max( value / model.densityRange.max, 0.2 );
      };
      component.link( componentListener );
      scratchpad[ `componentListener${paperProgramNumber}` ] = componentListener;
    };

    // removes 
    const removeComponentListeners = ( component ) => {
      component.unlink( scratchpad[ `componentListener${paperProgramNumber}` ] );
      delete scratchpad[ `componentListener${paperProgramNumber}` ];
    };

    if ( model[ propertyName ] ) {

      // Property exists, add the related listeners
      addComponentListener( model[ propertyName ] );
    }
    const modelAddedListener = ( componentName, component ) => {

      // Property was added after this one, add listeners to it
      if ( componentName === propertyName ) {
        addComponentListener( component );
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
    const model = sharedData.modelProperty.value;

    const propertyName = scratchpad[ `propertyName${paperProgramNumber}` ];
    if ( model[ propertyName ] ) {
      scratchpad[ `removeComponentListeners${paperProgramNumber}`]( model[ propertyName ] );
    }
    
    sharedData.scene.removeChild( scratchpad[ `imageNode${paperProgramNumber}` ] );

    phet.paperLand.modelComponentAddedEmitter.removeListener( scratchpad[ `modelAdded${paperProgramNumber}` ] );
    phet.paperLand.modelComponentRemovedEmitter.removeListener( scratchpad[ `modelRemoved${paperProgramNumber}` ] );

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
  ctx.fillText('Density', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('Image Transparency', canvas.width / 2, canvas.height / 2 + 20);
})();
