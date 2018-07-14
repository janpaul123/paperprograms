import blobStream from 'blob-stream';

import { code8400 } from '../dotCodes';

const PDFDocument = require('pdfkit');

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
  doc.circle(0, circleRadius * 6 + circleDistance * 3, circleRadius).fill(pattern[0]);
  doc.circle(0, circleRadius * 4 + circleDistance * 2, circleRadius).fill(pattern[1]);
  doc.circle(0, circleRadius * 2 + circleDistance, circleRadius).fill(pattern[2]);
  doc.circle(0, 0, circleRadius).fill(pattern[3]);
  doc.circle(circleRadius * 2 + circleDistance, 0, circleRadius).fill(pattern[4]);
  doc.circle(circleRadius * 4 + circleDistance * 2, 0, circleRadius).fill(pattern[5]);
  doc.circle(circleRadius * 6 + circleDistance * 3, 0, circleRadius).fill(pattern[6]);
  doc.restore();
}

// Draws four patterns, with `patterns` specified top-left first, then
// clock-wards. Will stay in the bounds of (0,0) to (width,height).
function drawPagePatterns({ doc, patterns, width, height, circleRadius, circleDistance, margin }) {
  const m = margin + circleRadius;
  drawLPattern({ doc, pattern: patterns[0], x: m, y: m, angle: 0, circleRadius, circleDistance });
  drawLPattern({
    doc,
    pattern: patterns[1],
    x: width - m,
    y: m,
    angle: 90,
    circleRadius,
    circleDistance,
  });
  drawLPattern({
    doc,
    pattern: patterns[2],
    x: width - m,
    y: height - m,
    angle: 180,
    circleRadius,
    circleDistance,
  });
  drawLPattern({
    doc,
    pattern: patterns[3],
    x: m,
    y: height - m,
    angle: 270,
    circleRadius,
    circleDistance,
  });
}

function drawPage({ patterns, title, code, metadata, paperSize }) {
  const doc = new PDFDocument({ size: paperSize, margin: 0 });
  const { width, height } = doc.page;

  const circleRadius = 20;
  const circleDistance = 20;
  const margin = 10;
  drawPagePatterns({ doc, patterns, circleRadius, circleDistance, margin, width, height });

  const textMargin = 10;
  const textLeft = margin + circleRadius * 8 + circleDistance * 3 + textMargin;
  const textWidth = width - textLeft * 2;

  const titleVOffset = -3;
  const titleSize = 24;
  const titleTop = margin + circleRadius - doc.currentLineHeight() / 2 + titleVOffset;
  doc.fontSize(titleSize).text(title, textLeft, titleTop, { width: textWidth, align: 'center' });

  const metadataVOffset = 5;
  const metadataSize = 14;
  const metadataTop =
    height -
    doc.currentLineHeight() -
    (margin + circleRadius - doc.currentLineHeight() / 2) +
    metadataVOffset;
  doc
    .fontSize(metadataSize)
    .text(metadata, textLeft, metadataTop, { width: textWidth, align: 'center' });

  const codeMargin = 15;
  const codeMarginTotal = margin + circleRadius * 2 + codeMargin;
  doc
    .font('Courier')
    .fontSize(11)
    .fillColor('#888888')
    .text(code, codeMarginTotal, codeMarginTotal, {
      width: width - codeMarginTotal * 2,
      height: height - codeMarginTotal * 2,
    });

  doc.end();
  return doc;
}

function drawCalibrationPage({ allColors, paperSize }) {
  const doc = new PDFDocument({ size: paperSize, layout: 'landscape' });
  const circleRadius = 20;
  const circleDistance = 20;
  doc.fontSize(35).text('Calibration page', 0, 30, { width: doc.page.width, align: 'center' });

  const offsetPerCircle = circleRadius * 2 + circleDistance;
  const marginLeft = (doc.page.width - allColors.length * offsetPerCircle) / 2;
  allColors.forEach((color, i) => {
    doc
      .circle(marginLeft + i * offsetPerCircle + circleRadius, doc.page.height / 2, circleRadius)
      .fill(color);
  });
  doc.end();
  return doc;
}

function generatePatterns({ number, allColors }) {
  return [0, 1, 2, 3].map(i =>
    code8400[number + code8400.length / 4 * i]
      .split('')
      .map(digit => allColors[parseInt(digit, 10)])
  );
}

function printDoc(doc) {
  const stream = doc.pipe(blobStream());
  stream.on('finish', () => {
    const iframe = document.createElement('iframe');
    iframe.onload = () => {
      iframe.contentWindow.print();
      // TODO: figure out when to call:
      // document.body.removeChild(iframe);
    };
    iframe.style.visibility = 'hidden';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.src = stream.toBlobURL('application/pdf');
    document.body.appendChild(iframe);
  });
}

const allColors = ['#ff0000', '#51ff00', '#00ccff', '#130030'];

export function printPage(number, name, code, paperSize) {
  printDoc(
    drawPage({
      patterns: generatePatterns({ number, allColors }),
      title: name,
      code,
      metadata: `${number} @ ${new Date().toISOString().split('T')[0]}`,
      paperSize,
    })
  );
}

export function printCalibrationPage(paperSize) {
  printDoc(drawCalibrationPage({ allColors, paperSize }));
}
