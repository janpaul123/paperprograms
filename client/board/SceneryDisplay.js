/**
 * SceneryDisplay is a React component that returns a div that contains a Scenery display.
 */

import React from 'react';
import { useEffect } from 'react';

const SceneryDisplay = () => {

  // This useEffect hook runs once after the component is rendered.  Effectively, this creates a Scenery display and
  // adds it to the div that was created when this element was initially rendered.
  useEffect( () => {
    console.log( 'Hey, I ran!' );
    const sceneryDisplayDomElement = document.getElementById( 'scenery-display' );
    console.log( `sceneryDisplayDomElement = ${sceneryDisplayDomElement}` );
    const scene = new scenery.Node();
    const sceneryDisplay = new scenery.Display( scene, {
      backgroundColor: 'black',
      container: sceneryDisplayDomElement
    } );
    const testRectangle = new scenery.Rectangle( 10, 10, 100, 100, { fill: 'green' } );
    scene.addChild( testRectangle );
    sceneryDisplay.updateDisplay();

    let left = 0;
    window.setInterval( () => {
      left += 5;
      console.log( `left = ${left}` );
      testRectangle.left = left;
      sceneryDisplay.updateDisplay();
    }, 1000 );
  }, [] );

  return <div id='scenery-display'></div>;
}

export default SceneryDisplay;
