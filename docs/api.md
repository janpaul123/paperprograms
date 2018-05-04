# Paper Programs API

Welcome to Paper Programs! Here's what you can do:

## Quickref

Importing:
- [`importScripts('paper.js')`](#imports)
- [`importScripts('http://<lib-url>.js')`](#imports)

Getting a Canvas:
- [`await paper.get('canvas')`](#canvas-for-paper)
- [`await paper.get('canvas', { width: 500 })`](#canvas-for-paper)
- [`await paper.get('canvas', { number: 1234 })`](#canvas-for-paper)
- [`await paper.get('supporterCanvas')`](#canvas-for-paper)

Data:
- [`await paper.get('number')`](#get-paper-data)
- [`await paper.get('papers')`](#get-paper-data)
- [`await paper.set('data', { someKey: 'someValue' })`](#setting-paper-data)

Extras:
- [`await paper.set('iframe', { src: 'http://www.example.com' })`](#cover-paper-in-an-iframe)
- [`paper.whenPointAt({callback, direction, whiskerLength, requiredData, paperNumber})`](#paper-whisker-to-detect-nearby-papers)
- [`await paper.get('camera')`](#camera-access)
- [`paper.drawFromCamera(ctx, camera, srcPoints, dstPoints)`](#camera-access)
- [`await paper.get('markers')`](#marker-points)

## Imports

Each Paper Program runs in its own [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers).  The standard way to import other scripts into a Web Worker context is via [importScripts](https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts), thus all Paper Programs first import the paperprogram API via:

```js
importScripts('paper.js');
```

If you wish to import other libraries, like [d3](https://d3js.org/) for example:

```js
importScripts('https://d3js.org/d3.v5.min.js');
```

## Logging

The following console statements will appear on the sidebar log of the editor:

```js
console.log("hello world");
console.error("error!");
console.warn("warning!");
console.info("info!");
```

## Async and Loops

We often use `await` statements with the API, so we usually create a top-level `async` context to use them in:

```js
(async () => {
  // Code goes in here.
})();
```

For looping (i.e. animations) we do not have access to [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) in a Web Worker, but we can use traditional [setInterval](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setInterval):

```js
setInterval(async () => {
  // Code goes in here.
}, 100);
```

## Getting Things

Retrieving things from the API happens usually with the following call.  We use `await` to wait for the promised value before proceeding:

```js
await paper.get(...)
```

## Canvas for Paper

This gives you a canvas to draw things over a specific paper:

```js
const canvas = await paper.get('canvas');                   // get my paper's canvas
const canvas = await paper.get('canvas', { width: 500 });   // get canvas, with custom size
const canvas = await paper.get('canvas', { number: 1234 }); // get another paper's canvas
```

## Canvas for Projector (a.k.a. Supporter)

This gives you a canvas over the entire projection.  (Each paper gets its own, so no interference)

```js
const supporterCanvas = await paper.get('supporterCanvas');
```

## Get Paper Data

All papers are assigned a unique number.  To get your paper's number:

```js
const number = await paper.get('number');
```

This number can be used to lookup information about the paper:

```js
const papers = await paper.get('papers');

papers[number].points   // corners of the paper {center,topLeft,topRight,bottomRight,bottomLeft}
papers[number].markers  // any dots detected inside the paper (array of {position,color})
papers[number].data     // arbitrary data set by paper.set('data')
```

## Setting Paper Data

You can set attributes on your paper that other papers can use:

```js
await paper.set('data', { someKey: 'someValue' });
```

## Cover Paper in an Iframe

You can set your paper to display an iframe:

```js
await paper.set('iframe', { src: 'http://www.example.com' });
```

## Paper Whisker to detect nearby papers

A paper can be given a "whisker" that lets you know when it touches another paper:

```js
paper.whenPointsAt({
  callback: ({paperNumber, paperObj}) => {
    /* do something */
  },

  // optional
  direction,      // "up" (default), "down", "left", "right"
  whiskerLength,  // as fraction of the side (default 0.7)
  requiredData,   // array of data fields that must be present in the other paper
  paperNumber,    // paper number to do this for (default is own paper number)
});
```

## Camera Access

You can draw a region of the camera picture to another destination region (using arbitrary quadrilaterals).

For example, to draw another paper's picture to your paper:

```js
const papers = await paper.get('papers');
const camera = await paper.get('camera');
paper.drawFromCamera(ctx, camera, papers[someNum].points, papers[myNum].points);
```

## Marker Points

Any dot that is not detected as part of a paper's corner is exposed as a _marker_.

All detected markers are exposed here:

```js
const markers = paper.get('markers');
```

Each marker has the following properties:

```js
{
  position: {x, y},  // global position
  color: [r, g, b],
  colorName,         // "red", "green", "blue" or "black"

  // WIP (planned)
  paperNumber,
  positionOnPaper: {x, y} // position converted to coordinate system of the paper
}
```

Also, each paper will know all the markers found inside its borders (WIP):

```js
const number = await paper.get('number');
const papers = await paper.get('papers');

// WIP (planned)
const markers = papers[number].markers;
```
