/**
 * SceneryDisplay is a React component that returns a div that contains a Scenery display.
 */

import React from 'react';
import { useEffect } from 'react';

const SceneryDisplay = ( props ) => {

  // This useEffect hook runs once after the component is rendered.  Effectively, this creates a Scenery display and
  // adds it to the div that was created when this element was initially rendered.
  useEffect( () => {
    const sceneryDisplayDomElement = document.getElementById( 'scenery-display' );
    const sceneryDisplay = new scenery.Display( props.scene, {
      backgroundColor: 'rgb(254, 252, 231)',
      container: sceneryDisplayDomElement
    } );
    sceneryDisplay.initializeEvents();
    const testRectangle = new scenery.Rectangle( 0, 0, 100, 100, { fill: 'green' } );
    props.scene.addChild( testRectangle );
    sceneryDisplay.updateDisplay();

    window.setInterval( () => {
      testRectangle.left = Math.min( 200, testRectangle.left + 5 );
      sceneryDisplay.updateDisplay();
    }, 1000 );
  }, [] );

  return <div id='scenery-display'></div>;
}

export default SceneryDisplay;
