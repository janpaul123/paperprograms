/**
 * SceneryDisplay is a React component that returns a div that contains a Scenery display.
 */

import React from 'react';
import { useEffect } from 'react';

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

    // Update the display at a regular interval.
    window.setInterval( () => {
      sceneryDisplay.updateDisplay();
    }, 1000 );
  }, [] );

  return <div id='scenery-display'></div>;
}

export default SceneryDisplay;
