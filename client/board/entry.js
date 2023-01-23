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

// constants
const assert = window.assert;
const DISPLAY_WIDTH = 640;
const DISPLAY_HEIGHT = 480;

// Create the root element for React.
const element = document.createElement( 'div' );
document.body.appendChild( element );

// Create the root of the scene graph for the Scenery node.
const scene = new scenery.Node();

ReactDOM.render(
  <SceneryDisplay scene={scene} width={DISPLAY_WIDTH} height={DISPLAY_HEIGHT}/>,
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
const button = new sun.TextPushButton( 'Don\`t get pushy.', {
  font: new scenery.Font( { size: '16px' } ),
  left: 100,
  top: 190
} );

const imageElement = document.createElement( 'img' );
imageElement.setAttribute( 'src', 'media/images/girlInAir.png' );
const image = new scenery.Image( imageElement, {
  left: 25,
  top: 25,
  maxWidth: 50
} );

const mapOfProgramsToComponents = new Map();

// Add or remove UI components based on the presence or absence of certain paper programs.
const updateUIComponents = presentPaperProgramInfo => {

  const dataByProgramNumber = JSON.parse( localStorage.paperProgramsDataByProgramNumber || '{}' );

  // Add components for paper programs that have appeared since the list time through this function.
  presentPaperProgramInfo.forEach( paperProgramInstanceInfo => {
    const paperProgramNumber = Number( paperProgramInstanceInfo.number );
    const programSpecificData = dataByProgramNumber[ paperProgramNumber ];

    if ( programSpecificData && !mapOfProgramsToComponents.has( paperProgramNumber ) ) {

      // Add the specified component.
      if ( programSpecificData.phetComponent === 'slider' ) {
        mapOfProgramsToComponents.set( paperProgramNumber, slider );
      }
      else if ( programSpecificData.phetComponent === 'checkbox' ) {
        mapOfProgramsToComponents.set( paperProgramNumber, checkbox );
      }
      else if ( programSpecificData.phetComponent === 'button' ) {
        mapOfProgramsToComponents.set( paperProgramNumber, button );
      }
      else if ( programSpecificData.phetComponent === 'image' ) {
        mapOfProgramsToComponents.set( paperProgramNumber, image );
      }
      scene.addChild( mapOfProgramsToComponents.get( paperProgramNumber ) );
    }

    // Position the component based on the position of the paper program.
    const uiComponent = mapOfProgramsToComponents.get( paperProgramNumber );

    if ( uiComponent ) {
      const normalizedCenterX = ( paperProgramInstanceInfo.points[ 0 ].x + paperProgramInstanceInfo.points[ 2 ].x ) / 2;
      const normalizedCenterY = ( paperProgramInstanceInfo.points[ 0 ].y + paperProgramInstanceInfo.points[ 2 ].y ) / 2;
      uiComponent.centerX = normalizedCenterX * DISPLAY_WIDTH;
      uiComponent.centerY = normalizedCenterY * DISPLAY_HEIGHT;
    }
  } );

  // Remove components for paper programs that have disappeared since the last time this function was run.
  const presentPaperProgramNumbers = presentPaperProgramInfo.map( info => Number( info.number ) );
  for ( let [ key, val ] of mapOfProgramsToComponents ) {
    if ( !presentPaperProgramNumbers.includes( key ) ) {
      scene.removeChild( val );
      mapOfProgramsToComponents.delete( key );
    }
  }
}

// Make updates when the local storage is updated. This is how the processes communicate.  Through experimentation, we
// (PhET devs) found that this is called every second even if nothing changes as long as there is at least one paper
// program in the detection window.
let paperProgramsInfo = [];
addEventListener( 'storage', () => {
  const currentPaperProgramsInfo = JSON.parse( localStorage.paperProgramsProgramsToRender );

  // Log information about changes to the available data.
  const currentProgramNumbers = currentPaperProgramsInfo.map( entry => Number( entry.number ) );
  const previousProgramNumbers = paperProgramsInfo.map( entry => Number( entry.number ) );
  currentProgramNumbers.forEach( currentProgramNumber => {
    if ( !previousProgramNumbers.includes( currentProgramNumber ) ) {
      console.log( `New program detected: ${currentProgramNumber}` );
    }
  } );
  previousProgramNumbers.forEach( previousProgramNumber => {
    if ( !currentProgramNumbers.includes( previousProgramNumber ) ) {
      console.log( `Program disappeared: ${previousProgramNumber}` );
    }
  } );

  // Update our copy of the into entries.
  paperProgramsInfo = currentPaperProgramsInfo;

  // Update the UI components on the screen.
  updateUIComponents( currentPaperProgramsInfo );
} );