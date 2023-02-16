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
const DISPLAY_SIZE = new dot.Dimension2( 640, 480 );

// Create the root element for React.
const simDisplayDiv = document.getElementById( 'sim-display' );
document.body.appendChild( simDisplayDiv );

// Create the root of the scene graph for the Scenery node.
const scene = new scenery.Node();

ReactDOM.render(
  <SceneryDisplay scene={scene} width={DISPLAY_SIZE.width} height={DISPLAY_SIZE.height}/>,
  simDisplayDiv
);

const mapOfProgramsToComponents = new Map();

// The model of our board, with all model Properties from programs. It is observable so that view elements and
// controller can update/reconstruct themselves when the model changes.
const modelProperty = new axon.Property( {} );

// If the model changes from programs, a timestamp is saved and we compare it to this saved timestamp to only
// reconstruct the model when needed
let lastUpdateTime = 0;

/**
 * Helper function to fill in string-based references to elements in a model with the actual value in the model.  If
 * no matching reference is found, an assertion is thrown.
 */
const resolveModelReferences = ( objectWithPotentialModelReferences, model ) => {

  // Make a clone of the object so that we don't need to change it.
  const objectWithResolvedReferences = _.cloneDeep( objectWithPotentialModelReferences );

  for ( const key in objectWithResolvedReferences ) {

    const value = objectWithResolvedReferences[ key ];

    // Model references are strings that start with 'model.', e.g. 'model.heightProperty'.
    if ( typeof value === 'string' && value.indexOf( 'model.' ) === 0 ) {

      const valueStringElements = value.split( '.' );
      const modelElementName = valueStringElements[ 1 ];

      // Note to future maintainers: The following code does not support nested model properties, so it will need to be
      // revised if and when that is needed.

      // Check that the decoded information looks correct and that the reference exists in the model.
      assert && assert(
        valueStringElements.length === 2,
        `unexpected number of keys in model reference: ${value}`
      );
      assert && assert(
        typeof modelElementName === 'string',
        `unexpected model element name value: ${modelElementName}`
      );
      assert && assert(
        model[ modelElementName ] !== undefined,
        `model element name not found in model: ${modelElementName}`
      );

      // Replace the reference to the model element with the element value.
      if ( model[ modelElementName ] !== undefined ) {
        objectWithResolvedReferences[ key ] = model[ modelElementName ];
      }
    }
  }

  return objectWithResolvedReferences;
};

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

// TODO: This should probably go.
const mapOfPaperProgramIdToViewComponentList = new Map();
const registerViewComponent = ( paperProgramNumber, viewComponent ) => {
  if ( !mapOfPaperProgramIdToViewComponentList.has( paperProgramNumber ) ) {
    mapOfPaperProgramIdToViewComponentList.set( paperProgramNumber, [] );
  }
  const viewComponentList = mapOfPaperProgramIdToViewComponentList.get( paperProgramNumber );
  viewComponentList.push( viewComponent );
};

// Helper function to compare two sets of paper program position points.
const pointsEqual = ( points1, points2 ) => {
  return points1[ 0 ].x === points2[ 0 ].x && points1[ 0 ].y === points2[ 0 ].y &&
         points1[ 1 ].x === points2[ 1 ].x && points1[ 1 ].y === points2[ 1 ].y &&
         points1[ 2 ].x === points2[ 2 ].x && points1[ 2 ].y === points2[ 2 ].y &&
         points1[ 3 ].x === points2[ 3 ].x && points1[ 3 ].y === points2[ 3 ].y;
}

// Update the model and add or remove UI components based on the presence or absence of certain paper programs.
const updateBoard = presentPaperProgramInfo => {

  const dataByProgramNumber = JSON.parse( localStorage.paperProgramsDataByProgramNumber || '{}' );

  // Add elements (model and view) for paper programs that have appeared since the last time through this function.
  presentPaperProgramInfo.forEach( paperProgramInstanceInfo => {
    const paperProgramNumber = Number( paperProgramInstanceInfo.number );
    const previousPaperProgramPoints = mapOfPaperProgramNumbersToPreviousPoints.get( paperProgramNumber );
    const currentPaperProgramPoints = paperProgramInstanceInfo.points;
    let paperProgramHasMoved = previousPaperProgramPoints === undefined ||
                               !pointsEqual( previousPaperProgramPoints, currentPaperProgramPoints );
    const programSpecificData = dataByProgramNumber[ paperProgramNumber ];

    // If this paper program contains model data, and that data has changed since the last time through this function,
    // update the local model Property.
    if ( programSpecificData && programSpecificData.updateTime && programSpecificData.updateTime > lastUpdateTime ) {

      lastUpdateTime = programSpecificData.updateTime;

      if ( programSpecificData.model ) {

        const newModelValue = {};
        for ( const field in programSpecificData.model ) {

          if ( field !== 'updateTime' ) {

            const modelObjectDescriptor = programSpecificData.model[ field ];

            // Extract and verify the namespace and type for this model element.
            const modelPropertyType = modelObjectDescriptor.type;
            assert && assert( typeof modelPropertyType === 'string', `unexpected model property type: ${modelPropertyType}` );
            const namespaceAndConstructor = modelPropertyType.split( '.' );
            const nameSpace = namespaceAndConstructor[ 0 ];
            assert && assert( window[ nameSpace ], `namespace not found on window: ${nameSpace}` );
            const className = namespaceAndConstructor[ 1 ];
            assert && assert( window[ nameSpace ][ className ], `class name not found on window.namespace: ${className}` );

            // Extract the arguments for constructing the model element.
            //
            // Note to future maintainers: This code assumes that there are always arguments when constructing a model
            // element.  Long term, that may or may not be a valid assumption, but as of this writing (Jan 2023), we don't
            // know, and are keeping it simple.  Feel free to add support for no-arg model elements if and when it is
            // needed.
            const modelPropertyArgs = resolveModelReferences( modelObjectDescriptor.args, newModelValue );

            // Extract and resolve the options if present.
            const modelPropertyOptions = modelObjectDescriptor.options === undefined ? {} :
                                         resolveModelReferences( modelObjectDescriptor.options, newModelValue );

            // Construct the model property using the namespace, class name, arguments, and options extracted from the
            // program-specific data.
            newModelValue[ field ] = new window[ namespaceAndConstructor[ 0 ] ][ namespaceAndConstructor[ 1 ] ](
              ...modelPropertyArgs,
              modelPropertyOptions
            );
          }
        }

        // Update the model Property.  There is an implicit assumption here that there is only one paper program that
        // defines the model.  If that ever changes, this will need to be a merge instead of an overwrite.
        modelProperty.value = newModelValue;

        // Log the model info (for debug purposes).
        console.log( 'Model updated, value:' );
        for ( const key in modelProperty.value ) {
          console.log( `  ${key}: ${modelProperty.value[ key ].toString()}` );
        }
      }
      if ( programSpecificData.program ) {

        // TODO: Remove handling of program as string once the newer approach is working, -jbphet 2/14/2023
        if ( typeof programSpecificData.program === 'string' ) {

          // Run the javascript code provided by the program
          eval( programSpecificData.program )();
        }
        else {

          // Run the JavaScript code provided by the paper program for when it is added to the detection window.
          eval( programSpecificData.program.onProgramAdded )( paperProgramNumber );
        }

        // the model may have changed in the eval, call listeners
        modelProperty.notifyListenersStatic();
      }
    }

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

    // TODO: If we keep this, consider moving into the updateTime block above.
    if ( programSpecificData && programSpecificData.phetComponent && !mapOfProgramsToComponents.has( paperProgramNumber ) ) {

      // Add the specified component.
      const labelString = programSpecificData.phetComponent.labelString;

      if ( programSpecificData.phetComponent.type === 'slider' ) {
        const valueProperty = new axon.Property( 0 );
        const range = new dot.Range( 0, 100 );
        const slider = new sun.HSlider( valueProperty, range );
        mapOfProgramsToComponents.set( paperProgramNumber, slider );
      }
      else if ( programSpecificData.phetComponent.type === 'checkbox' ) {
        const booleanProperty = new axon.Property( false );
        const checkboxLabel = new scenery.Text( labelString );
        const checkbox = new sun.Checkbox( booleanProperty, checkboxLabel );
        mapOfProgramsToComponents.set( paperProgramNumber, checkbox );
      }
      else if ( programSpecificData.phetComponent.type === 'button' ) {
        const button = new sun.TextPushButton( labelString, {
          font: new scenery.Font( { size: '16px' } )
        } );
        mapOfProgramsToComponents.set( paperProgramNumber, button );
      }
      else if ( programSpecificData.phetComponent.type === 'image' ) {
        const imageElement = document.createElement( 'img' );
        imageElement.setAttribute( 'src', `media/images/${programSpecificData.phetComponent.imageSource}` );
        const image = new scenery.Image( imageElement, {
          maxWidth: 100
        } );
        mapOfProgramsToComponents.set( paperProgramNumber, image );
      }

      scene.addChild( mapOfProgramsToComponents.get( paperProgramNumber ) );
    }

    // Position the component based on the position of the paper program.
    const uiComponent = mapOfProgramsToComponents.get( paperProgramNumber );

    if ( uiComponent ) {
      const normalizedCenterX = ( paperProgramInstanceInfo.points[ 0 ].x + paperProgramInstanceInfo.points[ 2 ].x ) / 2;
      const normalizedCenterY = ( paperProgramInstanceInfo.points[ 0 ].y + paperProgramInstanceInfo.points[ 2 ].y ) / 2;
      uiComponent.centerX = normalizedCenterX * DISPLAY_SIZE.width;
      uiComponent.centerY = normalizedCenterY * DISPLAY_SIZE.height;
    }

    // Update the paper program points for the next time through this loop.
    mapOfPaperProgramNumbersToPreviousPoints.set( paperProgramNumber, currentPaperProgramPoints );
  } );

  // Remove components for paper programs that have disappeared since the last time this function was run.
  const presentPaperProgramNumbers = presentPaperProgramInfo.map( info => Number( info.number ) );
  for ( let [ key, val ] of mapOfProgramsToComponents ) {
    if ( !presentPaperProgramNumbers.includes( key ) ) {
      scene.removeChild( val );
      mapOfProgramsToComponents.delete( key );
    }
  }

  // Remove view components that were registered by a paper program that has now gone away.
  for ( let [ paperProgramNumber, viewComponentList ] of mapOfPaperProgramIdToViewComponentList ) {
    if ( !presentPaperProgramNumbers.includes( paperProgramNumber ) ) {
      console.log( `Removing components for pp ${paperProgramNumber}, viewComponentList.length = ${viewComponentList.length}` );
      viewComponentList.forEach( viewComponent => {
        scene.removeChild( viewComponent );
      } );
      mapOfPaperProgramIdToViewComponentList.delete( paperProgramNumber );
    }
  }

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
  updateBoard( currentPaperProgramsInfo );
} );