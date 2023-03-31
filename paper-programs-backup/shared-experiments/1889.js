// Create Ohm's Law Model

importScripts('paper.js');

(async () => {

  //----------------------------------------------------------------------
  // Board code
  //----------------------------------------------------------------------

  // Get the paper number of this piece of paper (which should not change).
  const myPaperNumber = await paper.get('number');


  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {
    // Global model for this all programs
    const model = sharedData.model;
    
    // Safety checks that model properties do not already exist.
    if ( !model.resistanceProperty && !model.voltageProperty && !model.currentProperty ) {
      
      // Creates model properties, using axon because it has capabilities for dynmaic behaviour
      model.voltageProperty = new phet.axon.NumberProperty(
        4.5, // initial value
        {range: new phet.dot.Range(0.1,9)}  // value range (minValue,maxValue) 
      );

      model.resistanceProperty = new phet.axon.NumberProperty( 
        500, // initial value
        {range:new phet.dot.Range(10,1000)} // value range (minValue,maxValue) 
      );
      
      // This property has no range as it is calculated from the other two.
      model.currentProperty = new phet.axon.NumberProperty( 
        0.1 
      );
      // This is the calculation of the axon properties. If resistance or voltage change recalculate current.
      // Scratchpad creates variable for teh multilink that we can dispose of later.
      scratchpad.currentMultilink = phet.axon.Multilink.multilink([model.resistanceProperty, model.voltageProperty],(resistanceValue, voltageValue) =>{
        model.currentProperty.value = voltageValue/resistanceValue 
      })
      console.log( 'Added ohmsLawModel' ); // Describes what is added to the camera in the console.
    }
    else {
      alert( 'Ohm\'s Law model already exists in the model!' );
    }
  };
// This is tear down code that removes the programs when phyical papers are removed 
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    const model = sharedData.model;
    if ( model.resistanceProperty ) {
      model.resistanceProperty.dispose();
      delete model.resistanceProperty;
    }
    if ( model.voltageProperty ) {
      model.voltageProperty.dispose();
      delete model.voltageProperty;
      console.log( 'voltageProperty deleted' );
    }
    if ( model.currentProperty ) {
      model.currentProperty.dispose();
      delete model.currentProperty;
      scratchpad.currentMultilink.dispose();
      delete scratchpad.currentMultilink;
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
