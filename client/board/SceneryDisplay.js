/**
 * SceneryDisplay is a React component that returns a div that contains a Scenery display.
 */

import React, { useEffect } from 'react';

const SceneryDisplay = ( props ) => {

  // This useEffect hook runs once after the component is rendered.  Effectively, this creates a Scenery display and
  // adds it to the div that was created when this element was initially rendered.
  useEffect( () => {

    // Create the scenery display.
    const sceneryDisplayDomElement = document.getElementById( 'scenery-display' );
    const sceneryDisplay = new scenery.Display( props.scene, {
      width: props.width,
      height: props.height,
      backgroundColor: 'rgb(254, 252, 231)',
      container: sceneryDisplayDomElement
    } );

    // Make the scenery display interactive.
    sceneryDisplay.initializeEvents();

    // Add some text.  This helps indicate that things started successfully.
    const titleText = new scenery.Text( 'Scenery Display - Use paper programs to add components.', {
      font: new scenery.Font( { size: '20px' } ),
      left: 10,
      top: 10
    } )
    props.scene.addChild( titleText );
    sceneryDisplay.updateDisplay();

    // scenery workaround for consistent requestAnimationFrame
    scenery.Utils.polyfillRequestAnimationFrame();

    // set up animation
    sceneryDisplay.updateOnRequestAnimationFrame( dt => {
      // on startup, scenery updates with a dt of zero?
      if ( dt > 0 ) {

        // cap the largest animation frame (like when the tab is in the background) - in seconds
        dt = Math.min( dt, 0.05 );

        // step axon's timer (used by many phet-libs)
        axon.stepTimer.emit( dt );

        // steps model then view
        sceneryDisplay.updateDisplay();
      }
    } );
  }, [] );

  return <div id='scenery-display'></div>;
}

export default SceneryDisplay;
