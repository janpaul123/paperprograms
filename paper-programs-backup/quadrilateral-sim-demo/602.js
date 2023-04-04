// Quadrilateral iFrame and Connect
// Keywords: lol, hacks, sim, model, iframe
// Program Dependencies: N/A
// Recommended Programs: VertexA-D Controller
// Program Description: Puts the Quadrilateral simulation in an iframe and
// controls vertices with papers!

importScripts('paper.js');

(async () => {

  //----------------------------------------------------------------------
  // Board code
  //----------------------------------------------------------------------

  // Create model components (Properties that can change) when the program is added.
  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    scratchpad.iframe = document.createElement( 'iframe' );
    scratchpad.iframe.src = 'https://phet-dev.colorado.edu/html/quadrilateral/1.0.0-paperLandTest.1/phet/quadrilateral_all_phet.html?brand=phet&ea&debugger&deviceConnection&postMessageOnLoad&voicingInitiallyEnabled';
    // scratchpad.iframe.src = 'http://localhost:8080/quadrilateral/quadrilateral_en.html?brand=phet&ea&debugger&deviceConnection&postMessageOnLoad&voicingInitiallyEnabled'
    document.body.appendChild( scratchpad.iframe );

    const loadMessage = JSON.stringify( {
      type: 'quadrilateralCalibration',
      width: sharedData.displaySize.width,
      height: sharedData.displaySize.height
    } );

    const iframeWindow = scratchpad.iframe.contentWindow;
    iframeWindow.postMessage( loadMessage, '*' );

    scratchpad.windowMessageListener = event => {
      const data = JSON.parse( event.data );

      if ( data.type === 'load' ) {
        iframeWindow.postMessage( loadMessage, '*' );
      }
    };
    window.addEventListener( 'message', scratchpad.windowMessageListener );

    // model Properties for each Vertex position
    phet.paperLand.addModelComponent( 'vertexAPositionProperty', new phet.axon.Property( new phet.dot.Vector2( 0, 0 ) ) );
    phet.paperLand.addModelComponent( 'vertexBPositionProperty', new phet.axon.Property( new phet.dot.Vector2( 0, 0 ) ) );
    phet.paperLand.addModelComponent( 'vertexCPositionProperty', new phet.axon.Property( new phet.dot.Vector2( 0, 0 ) ) );
    phet.paperLand.addModelComponent( 'vertexDPositionProperty', new phet.axon.Property( new phet.dot.Vector2( 0, 0 ) ) );

    const globalModel = sharedData.model;
    
    scratchpad.multilink = phet.axon.Multilink.multilink( 
      [ globalModel.get( 'vertexAPositionProperty' ), globalModel.get( 'vertexBPositionProperty' ), globalModel.get( 'vertexCPositionProperty' ), globalModel.get( 'vertexDPositionProperty' ) ],
      ( aPosition, bPosition, cPosition, dPosition ) => {
        console.log( aPosition );

        // The simulation receives a message and knows how to use this data to set vertex positions.
        iframeWindow.postMessage( JSON.stringify( {
          type: 'quadrilateralControl', 
          vertexA: {
            x: aPosition.x,
            y: aPosition.y
          },
          vertexB: {
            x: bPosition.x,
            y: bPosition.y
          },
          vertexC: {
            x: cPosition.x,
            y: cPosition.y  
          },
          vertexD: {
            x: dPosition.x,
            y: dPosition.y
          },
          } ), '*' );
      }
    )
  };

  // This is tear down code that removes the programs when phyical papers are removed 
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    document.body.removeChild( scratchpad.iframe );
    delete scratchpad.iframe;

    window.removeEventListener( 'message', scratchpad.windowMessageListener );
    delete scratchpad.windowMessageListener;

    scratchpad.multilink.dispose();
    delete scratchpad.multilink;

    phet.paperLand.removeModelComponent( 'vertexAPositionProperty' );
    phet.paperLand.removeModelComponent( 'vertexBPositionProperty' );
    phet.paperLand.removeModelComponent( 'vertexCPositionProperty' );
    phet.paperLand.removeModelComponent( 'vertexDPositionProperty' );
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
  ctx.fillText('Quad', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.fillText('Test', canvas.width / 2, canvas.height / 2 + 20);
})();



