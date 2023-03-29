// Quadrilateral
// Keywords: lol, hacks

importScripts('paper.js');

(async () => {

  //----------------------------------------------------------------------
  // Board code
  //----------------------------------------------------------------------

  // Create model components (Properties that can change) when the program is added.
  const onProgramAdded = ( paperProgramNumber, scratchpad, sharedData ) => {

    scratchpad.iframe = document.createElement( 'iframe' );
    scratchpad.iframe.src = 'https://phet-dev.colorado.edu/html/quadrilateral/1.0.0-dev.76/phet/quadrilateral_all_phet.html?deviceConnection&postMessageOnLoad';
    document.body.appendChild( scratchpad.iframe );

    const iframeWindow = scratchpad.iframe.contentWindow;
    window.addEventListener( 'message', event => {
      console.log( event );
    } );
  };

  // This is tear down code that removes the programs when phyical papers are removed 
  const onProgramRemoved = ( paperProgramNumber, scratchpad, sharedData ) => {
    document.body.removeChild( scratchpad.iframe );
    delete scratchpad.iframe;
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


