// Thrust Control
// Keywords: model, p2, physics, controller
// ------------------------------- //
// Required Programs (dependencies) Lander
// Recommended Programs:
// Program Description: Controls the thrust for the Lander.

importScripts('paper.js');

(async () => {

  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchPad, sharedData ) => {
    const thrustProperty = sharedData.model.get( 'landerThrustProperty' );
    if ( thrustProperty ) {
      const range = new phet.dot.Range( 0, 25 );

      // This is the center in x or y dimensions of the paper, normalized from 0 to 1.
      // Graphics coordinate system has 0 at top so subtract from 1 so that 0 is at the bottom.
      const paperCenterX = ( positionPoints[ 0 ].x + positionPoints[ 2 ].x ) / 2;
      const paperCenterY = 1 - ( positionPoints[ 0 ].y + positionPoints[ 2 ].y ) / 2;  

      const newX = paperCenterX * range.max;
      const newY = paperCenterY * range.max;

      // make sure value is within the range
      const constrainedX = range.constrainValue( newX );
      const constrainedY = range.constrainValue( newY );

      // for x component of thrust, we want 0 at the center of the screen
      const centeredX = constrainedX - ( range.max / 2 );

      thrustProperty.value = new phet.dot.Vector2( centeredX, constrainedY );

      // print the y value of thrust to the console
      phet.paperLand.console.log( constrainedY );
    }
  };

  // Add the state change handler defined above as data for this paper.
  await paper.set('data', {
    paperPlaygroundData: {
      updateTime: Date.now(),
      eventHandlers: {
        onProgramChangedPosition: onProgramChangedPosition.toString()
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

