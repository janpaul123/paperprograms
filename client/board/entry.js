/**
 * Entry-point file for the Scenery-based display that is manipulated using the paper programs.
 *
 * @author John Blanco (PhET Interactive Simulations)
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @author Liam Mulhall (PhET Interactive Simulations)
 */

import React from 'react';
import ReactDOM from 'react-dom';
import SceneryDisplay from './SceneryDisplay.js';

// Create the root element for React.
const element = document.createElement( 'div' );
document.body.appendChild( element );

// Create the root of the scene graph for the Scenery node.
const scene = new scenery.Node();

ReactDOM.render(
  <SceneryDisplay scene={scene}/>,
  element
);

// Create UI components that will be added and removed from the scene graph based on the state of the paper programs.
const valueProperty = new axon.Property( 0 );
const range = new dot.Range( 0, 100 );
const slider = new sun.HSlider( valueProperty, range, {
  left: 100,
  top: 100
} );
const booleanProperty = new axon.Property( false );
const checkboxLabel = new scenery.Text( 'Check this out!' );
const checkbox = new sun.Checkbox( booleanProperty, checkboxLabel, {
  left: 100,
  top: 150
} );

// Add or remove UI components based on the presence or absence of certain paper programs.
const updateUIComponents = paperProgramsPresent => {

  // Add or remove the slider.
  const shouldHaveSlider = paperProgramsPresent && paperProgramsPresent.find( program => program.number === '839' );
  if ( shouldHaveSlider && !scene.hasChild( slider ) ){
    scene.addChild( slider );
  }
  else if (!shouldHaveSlider && scene.hasChild( slider )){
    scene.removeChild( slider );
  }

  // Add or remove the checkbox.
  const shouldHaveCheckbox = paperProgramsPresent && paperProgramsPresent.find( program => program.number === '1933' );
  if ( shouldHaveCheckbox && !scene.hasChild( checkbox ) ){
    scene.addChild( checkbox );
  }
  else if (!shouldHaveCheckbox && scene.hasChild( checkbox )){
    scene.removeChild( checkbox );
  }
}

// Make updates when the local storage is updated (this is how the processes communicate).
addEventListener( 'storage', () => {
  const paperProgramsPresent = JSON.parse( localStorage.paperProgramsProgramsToRender );
  updateUIComponents(paperProgramsPresent);

  // Debug - Log the programs that are currently present.
  if ( paperProgramsPresent ) {
    paperProgramsPresent.forEach( program => {
      console.log( `program.number = ${program.number}` );
    } );
  }
} );