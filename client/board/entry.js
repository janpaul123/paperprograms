/**
 * Entry-point file for the Sim Design Board, which is a scene graph based on the PhET libraries that uses PhET
 * components that can be manipulated using the paper programs.
 *
 * @author John Blanco (PhET Interactive Simulations)
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @author Liam Mulhall (PhET Interactive Simulations)
 */

import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import ReactDOM from 'react-dom';
import boardConsole from './boardConsole.js';
import styles from './BoardMain.css';
import BoardMain from './BoardMain.js';
import boardModel from './boardModel.js';

// constants
const DISPLAY_SIZE = new phet.dot.Dimension2(
  parseInt( styles.displayWidth, 10 ),
  parseInt( styles.displayHeight, 10 )
);

// Create the root element for React.
const simDisplayDiv = document.getElementById( 'board-root-element' );
document.body.appendChild( simDisplayDiv );

// Create the root of the scene graph.
const scene = new phet.scenery.Node();

// The object in localStorage on page load
const storedBoardConfig = JSON.parse( localStorage.boardConfig || '{}' );

// Defaults for the board configuration, if values are not saved to local storage
const defaultBoardConfig = {
  positionInterval: 0
};

// Combined config with localStorage overriding defaults. This will change during runtime as new values
// are set.
const boardConfigObject = {
  ...defaultBoardConfig,
  ...storedBoardConfig
};

// Populate with defaults.
localStorage.boardConfig = JSON.stringify( boardConfigObject );

// The amount of movement required for a program to be considered "moved" and trigger events
// related to changing positions. Value is normalized, so a value of 0.2 means it has to move
// 20% of the screen in either X or Y dimensions.
const updatePositionInterval = newValue => {
  saveValueToBoardConfig( 'positionInterval', newValue );
};

// Sets the new value to the runtime config object and local storage for next page load.
const saveValueToBoardConfig = ( nameString, value ) => {
  boardConfigObject[ nameString ] = value;
  localStorage.boardConfig = JSON.stringify( boardConfigObject );
};

// Render the scene graph.  Once this is done it updates itself, so there is no other React-based rendering of this
// component.
ReactDOM.render(
  <BoardMain
    scene={scene}
    boardConfigObject={boardConfigObject}
    updatePositionInterval={updatePositionInterval}
  ></BoardMain>,
  simDisplayDiv
);

// Initialize sound production.
const TRUE_PROPERTY = new phet.axon.BooleanProperty( true );
const FALSE_PROPERTY = new phet.axon.BooleanProperty( false );
phet.tambo.soundManager.enabledProperty.value = true;
phet.tambo.soundManager.initialize( TRUE_PROPERTY, TRUE_PROPERTY, TRUE_PROPERTY, TRUE_PROPERTY, FALSE_PROPERTY );

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
  model: boardModel,
  scene: scene,
  displaySize: DISPLAY_SIZE
};

// Returns true when both x and y of the provided points are equal within threshold.
const arePointsEqual = ( firstPoint, secondPoint, threshold ) => {
  return phet.dot.Utils.equalsEpsilon( firstPoint.x, secondPoint.x, threshold ) &&
         phet.dot.Utils.equalsEpsilon( firstPoint.y, secondPoint.y, threshold );
};

// Helper function to compare two sets of paper program position points. Points can differ within threshold and
// still be considered equal. Point values are normalized, so a threshold of 0.05 means "5% in both x and y".
const areAllPointsEqual = ( points1, points2, threshold ) => {
  return arePointsEqual( points1[ 0 ], points2[ 0 ], threshold ) &&
         arePointsEqual( points1[ 1 ], points2[ 1 ], threshold ) &&
         arePointsEqual( points1[ 2 ], points2[ 2 ], threshold ) &&
         arePointsEqual( points1[ 3 ], points2[ 3 ], threshold );
};

/**
 * Create an instance of WrappedAudioBuffer and return it, and start the process of decoding the audio file from the
 * provided path and load it into the buffer when complete.  Instances of WrappedAudioBuffer are often needed for
 * creating sounds using the tambo library.
 * TODO: Move this into a namespace like window.paperLand or window.phet.paperLand if retained.
 * @param {string} pathToAudioFile
 */
const createAndLoadWrappedAudioBuffer = pathToAudioFile => {
  const wrappedAudioBuffer = new phet.tambo.WrappedAudioBuffer();

  window.fetch( pathToAudioFile )
    .then( response => response.arrayBuffer() )
    .then( arrayBuffer => phet.tambo.phetAudioContext.decodeAudioData( arrayBuffer ) )
    .then( audioBuffer => {
      wrappedAudioBuffer.audioBufferProperty.value = audioBuffer;
    } );

  return wrappedAudioBuffer;
};

// This is here to prevent the IDE from marking the function as unused.  We need this, because the function is only
// used by the paper programs.
if ( !createAndLoadWrappedAudioBuffer ) {
  console.warn( 'createAndLoadWrappedAudioBuffer not defined' );
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
                               !areAllPointsEqual( previousPaperProgramPoints, currentPaperProgramPoints, boardConfigObject.positionInterval );
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

    // Update the paper program points for the next time through this loop. Only saved if there is sufficient
    // movement to trigger the next movement event.
    if ( paperProgramHasMoved ) {
      mapOfPaperProgramNumbersToPreviousPoints.set( paperProgramNumber, currentPaperProgramPoints );
    }
  } );

  // Run removal handlers for any paper programs that have disappeared.
  const presentPaperProgramNumbers = presentPaperProgramInfo.map( info => Number( info.number ) );

  mapOfProgramNumbersToEventHandlers.forEach( ( eventHandlers, paperProgramNumber ) => {
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
  } );
};

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
      boardConsole.log( `New program detected: ${currentProgramNumber}` );
    }
  } );
  previousProgramNumbers.forEach( previousProgramNumber => {
    if ( !currentProgramNumbers.includes( previousProgramNumber ) ) {
      boardConsole.log( `Program disappeared: ${previousProgramNumber}` );
    }
  } );

  // Update our local copy of the paper programs information.
  paperProgramsInfo = currentPaperProgramsInfo;

  // Update the sim design board.
  updateBoard( currentPaperProgramsInfo );
} );