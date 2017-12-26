#!/usr/bin/env node

const PDFDocument = require('pdfkit');
const fs = require('fs');
const hsl = require('hsl-to-hex');

// Never exit implicitly. See https://stackoverflow.com/a/47456805
// setInterval(() => {}, 100000);

process.on('unhandledRejection', error => {
  console.log('unhandledRejection', error.message);
  process.exit(1);
});

// Draws a pattern using colours from `pattern` like:
// 2 3 4
// 1
// 0
// with `x,y` in the middle of dot (2); `angle` rotating clock-wards; with
// radius `circleRadius`; spaced out by `circleDistance`.
function drawLPattern({ doc, pattern, x, y, angle, circleRadius, circleDistance }) {
  doc.save();
  doc.translate(x, y);
  doc.rotate(angle, { origin: [0, 0] });
  doc.circle(0, circleRadius * 4 + circleDistance * 2, circleRadius).fill(pattern[0]);
  doc.circle(0, circleRadius * 2 + circleDistance, circleRadius).fill(pattern[1]);
  doc.circle(0, 0, circleRadius).fill(pattern[2]);
  doc.circle(circleRadius * 2 + circleDistance, 0, circleRadius).fill(pattern[3]);
  doc.circle(circleRadius * 4 + circleDistance * 2, 0, circleRadius).fill(pattern[4]);
  doc.restore();
}

// Draws four patterns, with `patterns` specified top-left first, then
// clock-wards. Will stay in the bounds of (0,0) to (width,height).
function drawPagePatterns({ doc, patterns, width, height, circleRadius, circleDistance, margin }) {
  const m = margin + circleRadius;
  drawLPattern({ doc, pattern: patterns[0], x: m, y: m, angle: 0, circleRadius, circleDistance });
  drawLPattern({ doc, pattern: patterns[1], x: width - m, y: m, angle: 90, circleRadius, circleDistance });
  drawLPattern({ doc, pattern: patterns[2], x: width - m, y: height - m, angle: 180, circleRadius, circleDistance });
  drawLPattern({ doc, pattern: patterns[3], x: m, y: height - m, angle: 270, circleRadius, circleDistance });
}

function drawPage({ patterns, text, metadata }) {
  const doc = new PDFDocument({ margin: 0 });
  const { width, height } = doc.page;

  const circleRadius = 20;
  const circleDistance = 20;
  const margin = 10;
  drawPagePatterns({ doc, patterns, circleRadius, circleDistance, margin, width, height })

  const textMargin = 10;
  const textLeft = margin + circleRadius * 6 + circleDistance * 2 + textMargin;
  const textWidth = width - textLeft * 2;

  const titleVOffset = -3;
  const titleSize = 24;
  const titleTop = margin + circleRadius - doc.currentLineHeight() / 2 + titleVOffset;
  doc.fontSize(titleSize).text(text, textLeft, titleTop, { width: textWidth, align: 'center' });

  const metadataVOffset = 5;
  const metadataSize = 14;
  const metadataTop = height - doc.currentLineHeight() - (margin + circleRadius - doc.currentLineHeight() / 2) + metadataVOffset;
  doc.fontSize(metadataSize).text(metadata, textLeft, metadataTop, { width: textWidth, align: 'center' });

  doc.end();
  return doc;
}

function drawCalibrationPage({ allColors }) {
  const doc = new PDFDocument({ layout: 'landscape' });
  const circleRadius = 20;
  const circleDistance = 20;
  doc.fontSize(35).text("Calibration page", 0, 30, { width: doc.page.width, align: 'center' });

  const offsetPerCircle = circleRadius * 2 + circleDistance;
  const marginLeft = (doc.page.width - allColors.length * offsetPerCircle) / 2;
  allColors.forEach((color, i) => {
    doc.circle(marginLeft + i * offsetPerCircle + circleRadius, doc.page.height / 2, circleRadius).fill(color);
  });
  doc.end();
  return doc;
}

function generatePatterns({ id, allColors }) {
  const string = id.toString(5).padStart(4, "0");
  if (string.length !== 4) throw new Error('Incorrect string length');

  function posToCol(index) {
    return allColors[parseInt(string[index], 10)];
  }

  return [0, 1, 2, 3].map((i) => [posToCol(0), posToCol(1), allColors[i], posToCol(2), posToCol(3)]);
}

const allColors = ['#ff0000', '#ff9900', '#51ff00', '#00ccff', '#dd00ff']

drawPage({ patterns: generatePatterns({ id: 123, allColors }), text: 'Test program', metadata: `123 @ ${new Date().toISOString().split('T')[0]}` }).pipe(fs.createWriteStream('output.pdf'));

drawCalibrationPage({ allColors }).pipe(fs.createWriteStream('calibration.pdf'));
