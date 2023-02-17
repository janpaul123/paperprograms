/**
 * Entry-point file for the Sim Design Board, which is a scene graph based on the PhET libraries that uses PhET
 * components that can be manipulated using the paper programs.
 *
 * @author John Blanco (PhET Interactive Simulations)
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @author Liam Mulhall (PhET Interactive Simulations)
 */

import React from 'react';
import ReactDOM from 'react-dom';
import SceneryDisplay from './SceneryDisplay.js';

// constants
const DISPLAY_SIZE = new dot.Dimension2( 640, 480 );

// Create the root element for React.
const simDisplayDiv = document.getElementById( 'sim-display' );
document.body.appendChild( simDisplayDiv );

// Create the root of the scene graph.
const scene = new scenery.Node();

// Render the scene graph.  Once this is done it updates itself, so there is no other React-based rendering of this
// component.
ReactDOM.render(
  <SceneryDisplay scene={scene} width={DISPLAY_SIZE.width} height={DISPLAY_SIZE.height}/>,
  simDisplayDiv
);

// The model of our sim design board, with all model Properties from paper programs. It is observable so that view
// elements and controllers can update/reconstruct themselves when the model changes.
const modelProperty = new axon.Property( {} );

// timestamp of the last update of paper program information
let lastUpdateTime = 0;

// {Map<number,Object>} - Event handlers from the paper programs, stored as strings.  These are evaluated when the
// programs are added, moved, or removed, see the usage below for details.
const mapOfProgramNumbersToEventHandlers = new Map();

// {Map<number,Object>} - Temporary data that can be set and used by the paper program code when they are in the
// detection window.  This data is generally set when a paper program comes into the field of view, used while it is
// there, and cleared when it goes out of the field of view.
const mapOfProgramNumbersToScratchpadObjects = new Map();

// {Map<number,Object>} - map of paper program numbers that are present in the detection window to their position points
const mapOfPaperProgramNumbersToPreviousPoints = new Map();

// {Object} - This object contains the data that is passed into the handlers for the paper programs and can be used to
// share information between them.  The data can be referenced and sometimes updated.
const sharedData = {
  modelProperty: modelProperty,
  scene: scene,
  displaySize: DISPLAY_SIZE
};

// Helper function to compare two sets of paper program position points.
const pointsEqual = ( points1, points2 ) => {
  return points1[ 0 ].x === points2[ 0 ].x && points1[ 0 ].y === points2[ 0 ].y &&
         points1[ 1 ].x === points2[ 1 ].x && points1[ 1 ].y === points2[ 1 ].y &&
         points1[ 2 ].x === points2[ 2 ].x && points1[ 2 ].y === points2[ 2 ].y &&
         points1[ 3 ].x === points2[ 3 ].x && points1[ 3 ].y === points2[ 3 ].y;
}

// Update the sim design board based on changes to the paper programs.
const updateBoard = presentPaperProgramInfo => {

  const dataByProgramNumber = JSON.parse( localStorage.paperProgramsDataByProgramNumber || '{}' );

  // Process the data associated with each of the paper programs that are currently present in the detection window.
  presentPaperProgramInfo.forEach( paperProgramInstanceInfo => {

    const paperProgramNumber = Number( paperProgramInstanceInfo.number );
    const previousPaperProgramPoints = mapOfPaperProgramNumbersToPreviousPoints.get( paperProgramNumber );
    const currentPaperProgramPoints = paperProgramInstanceInfo.points;
    let paperProgramHasMoved = previousPaperProgramPoints === undefined ||
                               !pointsEqual( previousPaperProgramPoints, currentPaperProgramPoints );
    const programSpecificData = dataByProgramNumber[ paperProgramNumber ];

    // If this paper program contains data that is intended for use by the sim design board, and that data has changed
    // since the last time through this function, process the changes.
    if ( programSpecificData &&
         programSpecificData.paperPlaygroundData &&
         programSpecificData.paperPlaygroundData.updateTime > lastUpdateTime ) {

      lastUpdateTime = programSpecificData.paperPlaygroundData.updateTime;

      // If there are no handlers for this program, it means that it just appeared in the detection window.
      const paperProgramJustAppeared = !mapOfProgramNumbersToEventHandlers.has( paperProgramNumber );

      if ( !paperProgramJustAppeared ) {

        // Since the paper didn't just appear in the detection window, it indicates that its program probably changed.
        // Since pretty much anything could have changed about the program, we treat this as a removal and re-appearance
        // of the program.
        const eventHandlers = mapOfProgramNumbersToEventHandlers.get( paperProgramNumber );
        if ( eventHandlers.onProgramRemoved ) {
          eval( eventHandlers.onProgramRemoved )(
            paperProgramNumber,
            mapOfProgramNumbersToScratchpadObjects.get( paperProgramNumber ),
            sharedData
          );
        }
      }

      // Extract the event handlers from the program, since they are either new or potentially changed.
      mapOfProgramNumbersToEventHandlers.set( paperProgramNumber, programSpecificData.paperPlaygroundData.eventHandlers || {} );

      // Set the scratchpad data to an empty object.
      mapOfProgramNumbersToScratchpadObjects.set( paperProgramNumber, {} );

      // Run this program's "added" handler, if present (and generally it should be).
      const eventHandlers = mapOfProgramNumbersToEventHandlers.get( paperProgramNumber );
      if ( eventHandlers.onProgramAdded ) {
        eval( eventHandlers.onProgramAdded )(
          paperProgramNumber,
          mapOfProgramNumbersToScratchpadObjects.get( paperProgramNumber ),
          sharedData
        );

        // Make sure that the position change handler gets called.
        paperProgramHasMoved = true;
      }
    }

    // If the paper has moved and there is a move handler, call it.
    const eventHandlers = mapOfProgramNumbersToEventHandlers.get( paperProgramNumber );
    if ( paperProgramHasMoved && eventHandlers && eventHandlers.onProgramChangedPosition ) {
      eval( eventHandlers.onProgramChangedPosition )(
        paperProgramNumber,
        currentPaperProgramPoints,
        mapOfProgramNumbersToScratchpadObjects.get( paperProgramNumber ),
        sharedData
      );
    }

    // Update the paper program points for the next time through this loop.
    mapOfPaperProgramNumbersToPreviousPoints.set( paperProgramNumber, currentPaperProgramPoints );
  } );

  // Run removal handlers for any paper programs that have disappeared.
  for ( let [ paperProgramNumber, eventHandlers ] of mapOfProgramNumbersToEventHandlers ) {
    if ( !presentPaperProgramNumbers.includes( paperProgramNumber ) ) {

      // This paper program has disappeared.  Run its removal method and clear its data.
      if ( eventHandlers.onProgramRemoved ) {
        eval( eventHandlers.onProgramRemoved )(
          paperProgramNumber,
          mapOfProgramNumbersToScratchpadObjects.get( paperProgramNumber ),
          sharedData
        );
      }
      mapOfProgramNumbersToEventHandlers.delete( paperProgramNumber );
      mapOfProgramNumbersToScratchpadObjects.delete( paperProgramNumber );
    }
  }
}

// Handle changes to local storage.  This is how paper programs communicate with the sim design board.
// Note: Through experimentation, we (PhET devs) found that this is called every second even if nothing changes as long
// as there is at least one paper program in the detection window.
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

  // Update our local copy of the paper programs information.
  paperProgramsInfo = currentPaperProgramsInfo;

  // Update the sim design board.
  updateBoard( currentPaperProgramsInfo );
} );