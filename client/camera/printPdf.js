import { paperSizes } from '../constants.js';

import { code8400 } from '../dotCodes';

// const PDFDocument = require('pdfkit');

// Draws a pattern using colours from `pattern` like:
// 2 3 4
// 1
// 0
// with `x,y` in the middle of dot (2); `angle` rotating clock-wards; with
// radius `circleRadius`; spaced out by `circleDistance`.
function drawLPattern( { canvas, pattern, x, y, angle, circleRadius, circleDistance } ) {
  const canvasContext = canvas.getContext( "2d" );

  canvasContext.save();

  canvasContext.translate( x, y );
  canvasContext.rotate( angle * Math.PI / 180 ); // convert to radians

  drawCircle( canvasContext, 0, circleRadius * 6 + circleDistance * 3, circleRadius, pattern[ 0 ] );
  drawCircle( canvasContext, 0, circleRadius * 4 + circleDistance * 2, circleRadius, pattern[ 1 ] );
  drawCircle( canvasContext, 0, circleRadius * 2 + circleDistance, circleRadius, pattern[ 2 ] );
  drawCircle( canvasContext, 0, 0, circleRadius, pattern[ 3 ] );
  drawCircle( canvasContext, circleRadius * 2 + circleDistance, 0, circleRadius, pattern[ 4 ] );
  drawCircle( canvasContext, circleRadius * 4 + circleDistance * 2, 0, circleRadius, pattern[ 5 ] );
  drawCircle( canvasContext, circleRadius * 6 + circleDistance * 3, 0, circleRadius, pattern[ 6 ] );

  canvasContext.restore();
}

function drawCircle( canvasContext, x, y, radius, fillColor ) {
  canvasContext.beginPath();
  canvasContext.arc( x, y, radius, 0, 2 * Math.PI );
  canvasContext.fillStyle = fillColor;
  canvasContext.fill();
}

// Draws four patterns, with `patterns` specified top-left first, then
// clock-wards. Will stay in the bounds of (0,0) to (width,height).
function drawPagePatterns( { canvas, patterns, width, height, circleRadius, circleDistance, margin } ) {
  const m = margin + circleRadius;
  drawLPattern( { canvas, pattern: patterns[ 0 ], x: m, y: m, angle: 0, circleRadius, circleDistance } );
  drawLPattern( {
    canvas,
    pattern: patterns[ 1 ],
    x: width - m,
    y: m,
    angle: 90,
    circleRadius,
    circleDistance
  } );
  drawLPattern( {
    canvas,
    pattern: patterns[ 2 ],
    x: width - m,
    y: height - m,
    angle: 180,
    circleRadius,
    circleDistance
  } );
  drawLPattern( {
    canvas,
    pattern: patterns[ 3 ],
    x: m,
    y: height - m,
    angle: 270,
    circleRadius,
    circleDistance
  } );
}

function drawPage( { patterns, title, metadata, paperSize } ) {

  const dimensions = paperSizes[ paperSize ];
  const canvas = document.createElement( 'canvas' );
  const canvasContext = canvas.getContext( "2d" );

  const width = dimensions[ 0 ];
  const height = dimensions[ 1 ];

  canvas.width = width;
  canvas.height = height;

  // first fill with white so we can see things
  canvasContext.fillStyle = 'white';
  canvasContext.fillRect( 0, 0, width, height );

  const circleRadius = 20;
  const circleDistance = 20;
  const margin = 10;
  drawPagePatterns( { canvas, patterns, circleRadius, circleDistance, margin, width, height } );

  canvasContext.fillStyle = 'black';
  const textMargin = 10;
  const textLeft = margin + circleRadius * 8 + circleDistance * 3 + textMargin;
  const textWidth = width - textLeft * 2;

  const titleVOffset = 10;
  const titleSize = 24;
  const titleTop = margin + circleRadius + titleVOffset;

  canvasContext.font = `${titleSize}px serif`;
  canvasContext.fillText( title, textLeft, titleTop, textWidth );

  const metadataVOffset = 5;
  const metadataSize = 14;

  const metadataTop = height - metadataSize - ( margin + circleRadius - metadataSize / 2 ) + metadataVOffset;
  canvasContext.font = `${metadataSize}px`;
  canvasContext.fillText( metadata, textLeft, metadataTop, textWidth );

  return canvas;
}

// Used to return the PDFDocument, now it returns a canvas
function drawCalibrationPage( { allColors, paperSize } ) {
  const circleRadius = 20;
  const circleDistance = 20;

  const dimensions = paperSizes[ paperSize ];
  const canvas = document.createElement( 'canvas' );
  canvas.width = dimensions[ 0 ];
  canvas.height = dimensions[ 1 ];
  const canvasContext = canvas.getContext( "2d" );

  // fill the background with white so it can be seen (hopefully this doesn't take ink to print??)
  canvasContext.beginPath();
  canvasContext.fillStyle = 'white';
  canvasContext.fillRect( 0, 0, canvas.width, canvas.height );

  const offsetPerCircle = circleRadius * 2 + circleDistance;
  const marginLeft = ( canvas.width - allColors.length * offsetPerCircle ) / 2;
  allColors.forEach( ( color, i ) => {
    canvasContext.beginPath();
    canvasContext.arc( marginLeft + i * offsetPerCircle + circleRadius, canvas.height / 2, circleRadius, 0, 2 * Math.PI );
    canvasContext.fillStyle = color;
    canvasContext.fill();
  } );

  return canvas;
}

function generatePatterns( { number, allColors } ) {
  return [ 0, 1, 2, 3 ].map( i =>
    code8400[ number + code8400.length / 4 * i ]
      .split( '' )
      .map( digit => allColors[ parseInt( digit, 10 ) ] )
  );
}

const allColors = [ '#ff0000', '#51ff00', '#00ccff', '#130030' ];

export function printPage( number, name, paperSize ) {
  const canvas = drawPage( {
    patterns: generatePatterns( { number, allColors } ),
    title: name,
    metadata: `${number} @ ${new Date().toISOString().split( 'T' )[ 0 ]}`,
    paperSize
  } );

  saveCanvas( canvas, `${name}-${number}.png` );
}

// Save a canvas to an image so that we can print it. From
// https://stackoverflow.com/questions/10673122/how-to-save-canvas-as-an-image-with-canvas-todataurl
function saveCanvas( canvas, fileNameString ) {
  const link = document.createElement( 'a' );
  link.setAttribute( 'download', fileNameString );
  link.setAttribute( 'href', canvas.toDataURL( "image/png" ).replace( "image/png", "image/octet-stream" ) );
  link.click();
}

export function printCalibrationPage( paperSize ) {
  const calibrationCanvas = drawCalibrationPage( { allColors, paperSize } );
  saveCanvas( calibrationCanvas, "calibration-page.png" );
}