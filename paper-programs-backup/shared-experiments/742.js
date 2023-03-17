// Control Altitude w/ Paper

importScripts('paper.js');

(async () => {

  const onProgramChangedPosition = ( paperProgramNumber, positionPoints, scratchpad, sharedData ) => {
    console.log( `onProgramChangedPosition called for ppn ${paperProgramNumber}`);

    const model = sharedData.modelProperty.value;
    if ( model.altitudeProperty ){

      const maxAltitude = 10;

      // Set the altitude based on the position of the paper.
      const paperCenterY = ( positionPoints[0].y + positionPoints[2].y ) / 2;
      model.altitudeProperty.value = ( 1 - paperCenterY ) * maxAltitude;
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

  // Write some text on the canvas.
  const ctx = canvas.getContext('2d');
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgb(100,0,100)';
  ctx.fillText('Move to', canvas.width / 2, canvas.height / 2 - 20);
  ctx.fillText('control', canvas.width / 2, canvas.height / 2);
  ctx.fillText('altitude.', canvas.width / 2, canvas.height / 2 + 20);
})();
