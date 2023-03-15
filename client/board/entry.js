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
import paperLand from './paperLand.js';
import SceneryDisplay from './SceneryDisplay.js';

// constants
const DISPLAY_SIZE = new phet.dot.Dimension2( 640, 480 );

// Create the root element for React.
const simDisplayDiv = document.getElementById( 'sim-display' );
document.body.appendChild( simDisplayDiv );

// Create the root of the scene graph.
const scene = new phet.scenery.Node();

// Render the scene graph.  Once this is done it updates itself, so there is no other React-based rendering of this
// component.
ReactDOM.render(
  <SceneryDisplay scene={scene} width={DISPLAY_SIZE.width} height={DISPLAY_SIZE.height}/>,
  simDisplayDiv
);

// Initialize sound production.
const TRUE_PROPERTY = new phet.axon.BooleanProperty( true );
const FALSE_PROPERTY = new phet.axon.BooleanProperty( false );
phet.tambo.soundManager.enabledProperty.value = true;
phet.tambo.soundManager.initialize( TRUE_PROPERTY, TRUE_PROPERTY, TRUE_PROPERTY, TRUE_PROPERTY, FALSE_PROPERTY );

// The model of our sim design board, with all model Properties from paper programs. It is observable so that view
// elements and controllers can update/reconstruct themselves when the model changes.
const modelProperty = new phet.axon.Property( {} );

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

// Emits events when model components are added or removed, to be used in program code. Emits with
// {string} - name of the model component
// {*} - Reference to the component being added or removed
paperLand.modelComponentAddedEmitter = new window.phet.axon.Emitter();
paperLand.modelComponentRemovedEmitter = new window.phet.axon.Emitter();

/**
 * Adds a model component to the model Object with the provided name. Emits events so client code can observe
 * changes to the model.
 * @param {string} componentName
 * @param {*} componentObject - any model component (Property, or object with multiple Properties and values)
 */
paperLand.addModelComponent = ( componentName, componentObject ) => {
  const existingModel = modelProperty.value;
  if ( existingModel[ componentName ] === undefined ) {

    // Update the model Property, which is also our map for name -> component
    modelProperty.value = {
      [ componentName ]: componentObject,

      // spread operator copies existing model into a new object
      ...existingModel
    }

    paperLand.modelComponentAddedEmitter.emit( componentName, componentObject );
  }
  else {
    console.warn( `Model already has component with name ${componentName}` );
  }
}

/**
 * Remove a component with the provided name from the model. Updates the global modelProperty which is our map
 * of all model components and also emits a separate Emitter.
 * @param {string} componentName
 */
paperLand.removeModelComponent = componentName => {
  const existingModel = modelProperty.value;
  const componentObject = existingModel[ componentName ];

  if ( componentObject === undefined ) {
    console.warn( `Model does not have component with name ${componentName}` );
  }
  else {

    // delete the object from the global model and then reassign to trigger a Property change
    const objectCopy = { ...existingModel };
    delete objectCopy[ componentName ];
    modelProperty.value = objectCopy;

    // emit events, passing the componentObject through so that client can dispose of various objects
    paperLand.modelComponentRemovedEmitter.emit( componentName, componentObject );

    // dispose the component when we are done with it, if supported
    componentObject.dispose && componentObject.dispose();
  }
};

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