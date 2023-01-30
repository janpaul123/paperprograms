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

// Update the model and add or remove UI components based on the presence or absence of certain paper programs.
const updateBoard = presentPaperProgramInfo => {

  const dataByProgramNumber = JSON.parse( localStorage.paperProgramsDataByProgramNumber || '{}' );

  // Add elements (model and view) for paper programs that have appeared since the last time through this function.
  presentPaperProgramInfo.forEach( paperProgramInstanceInfo => {
    const paperProgramNumber = Number( paperProgramInstanceInfo.number );
    const programSpecificData = dataByProgramNumber[ paperProgramNumber ];

    // If this paper program contains model data, and that data has changed since the last time through this function,
    // update the local model Property.
    if ( programSpecificData && programSpecificData.model && programSpecificData.model.updateTime > lastUpdateTime ) {

      lastUpdateTime = programSpecificData.model.updateTime;

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
        imageElement.setAttribute( 'src', 'media/images/lunarLander.png' );
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
  updateBoard( currentPaperProgramsInfo );
} );