// OL - Model from template - Copy
// Keywords: model, value, property, properties, ohms law

importScripts('paper.js');

(async () => {

  //----------------------------------------------------------------------
  // Board code
  //----------------------------------------------------------------------

  // Get the paper number of this piece of paper (which should not change).
  const myPaperNumber = await paper.get('number');

  // Create model components (Properties that can change) when the program is added.
  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {
    
    // Global model for all programs
    const model = sharedData.model;
    if ( !model.voltageProperty ) {
      
      // Creates model properties, using axon because it has capabilities for dynmaic behaviour
      model.voltageProperty = new phet.axon.NumberProperty(
      4.5, // initial value
      {range: new phet.dot.Range(0.1,9)}  // value range (minValue,maxValue) 
    );
    }

    if ( !model.resistanceProperty ) {
      
      // Creates model properties, using axon because it has capabilities for dynmaic behaviour
      model.resistanceProperty = new phet.axon.NumberProperty(
      500, // initial value
      {range:new phet.dot.Range(10,1000)}  // value range (minValue,maxValue) 
    );
    }

    // Current is derived from voltage/resistance
    if ( !model.currentProperty ) {
      model.currentProperty = new phet.axon.DerivedProperty(

        // This is the array of Properties. Replace firstProperty and secondProperty
        // with other Properties you created. Can take any number of Properties.
        [ model.voltageProperty, model.resistanceProperty],

        // The values of the Properties when they change. Rename accordingly.
        ( voltageValue, resistanceValue ) => {

            // Add your calculation here. This default adds them together.
            return voltageValue / resistanceValue;
        }
      );
    }
  };

  // This is tear down code that removes the programs when phyical papers are removed 
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {

    // Delete your model Properties here.
    if ( model.voltageProperty ) {
    model.voltageProperty.dispose();
    delete model.voltageProperty;
    }

    if ( model.resistanceProperty ) {
    model.reistanceProperty.dispose();
    delete model.resistanceProperty;
    } 

    if ( model.currentProperty ) {
    model.currentProperty.dispose();
    delete model.currentProperty;
    }
  };

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
  ctx.fillText('Create', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('ohmsLawModel', canvas.width / 2, canvas.height / 2 + 20);
})();



