import React from 'react';
import ReactDOM from 'react-dom';
import uuidv4 from 'uuid/v4';
import * as d3 from 'd3';

import CameraMain from './CameraMain';

const storedConfig = JSON.parse( localStorage.paperProgramsConfig || '{}' );

// Check to see if there is an existing, previously selected space in local storage.  If not, create a default.
const selectedSpaceName = storedConfig.selectedSpaceName || uuidv4().slice( 0, 8 );

// Define a default
const defaultConfig = {
  paperSize: 'LETTER',
  colorsRGB: [ [ 119, 43, 24, 255 ], [ 94, 104, 48, 255 ], [ 65, 80, 84, 255 ], [ 0, 0, 0, 255 ] ],
  paperDotSizes: [ 8, 8, 8, 8 ],
  knobPoints: [ { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 } ],
  zoomTransform: d3.zoomIdentity,
  showOverlayKeyPointCircles: true,
  showOverlayKeyPointText: true,
  showOverlayComponentLines: true,
  showOverlayShapeId: true,
  showOverlayProgram: true,
  selectedSpaceName,
  freezeDetection: false,
  showPrintedInQueue: false,
  scaleFactor: 4
};

function sanitizeConfig( config ) {
  const newConfig = { ...config };
  if ( newConfig.colorsRGB.length !== defaultConfig.colorsRGB.length ) {
    newConfig.colorsRGB = defaultConfig.colorsRGB;
  }

  if ( !newConfig.paperDotSizes ) {
    newConfig.paperDotSizes = defaultConfig.paperDotSizes;
  }
  return newConfig;
}

localStorage.paperProgramsConfig = JSON.stringify(
  sanitizeConfig( {
    ...defaultConfig,
    ...storedConfig
  } )
);

if ( !localStorage.hasOwnProperty( 'paperProgramsProgramsToRender' ) ) {
  localStorage.paperProgramsProgramsToRender = JSON.stringify( [] );
}

if ( !localStorage.hasOwnProperty( 'paperProgramsMarkers' ) ) {
  localStorage.paperProgramsMarkers = JSON.stringify( [] );
}

const element = document.createElement( 'div' );
document.body.appendChild( element );

function render() {
  ReactDOM.render(
    <CameraMain
      config={JSON.parse( localStorage.paperProgramsConfig )}
      paperProgramsProgramsToRender={JSON.parse( localStorage.paperProgramsProgramsToRender )}
      onConfigChange={config => {
        localStorage.paperProgramsConfig = JSON.stringify( config );
        render();
      }}
      onMarkersChange={markers => {
        localStorage.paperProgramsMarkers = JSON.stringify( markers );
        render();
      }}
      onProgramsChange={programs => {
        localStorage.paperProgramsProgramsToRender = JSON.stringify( programs );
        render();
      }}
    />,
    element
  );
}

render();
