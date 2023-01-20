/**
 * Entry-point file for the Scenery-based display that is manipulated using the paper programs.
 *
 * @author John Blanco (PhET Interactive Simulations)
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import React from 'react';
import ReactDOM from 'react-dom';
import SceneryDisplay from './SceneryDisplay.js';

const element = document.createElement( 'div' );
document.body.appendChild( element );

const scene = new scenery.Node();

ReactDOM.render(
  <SceneryDisplay scene={scene}/>,
  element
);

// TODO: Totally lame test code, must be removed eventually.
setTimeout( () => {
  const valueProperty = new axon.Property( 0 );
  const range = new dot.Range( 0, 100 );
  const slider = new sun.HSlider( valueProperty, range, {
    left: 100,
    top: 100
  } );
  scene.addChild( slider );
  const booleanProperty = new axon.Property( false );
  const checkboxLabel = new scenery.Text( 'Check this out!' );
  const checkbox = new sun.Checkbox( booleanProperty, checkboxLabel, {
    left: 100,
    top: 150
  } );
  scene.addChild( checkbox );
}, 1000 );
