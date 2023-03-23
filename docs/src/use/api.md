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
const whisker = await paper.get('whisker', {direction: 'up'})
```

You can react to different events with a whisker

```js
whisker.on('paperAdded', ({paperNumber, paper}) => {
  console.log('added paper', paperNumber)
})

whisker.on('paperRemoved', ({paperNumber, paper}) => {
  console.log('removed paper', paperNumber)
})

whisker.on('movedWhisker', ({ x, y }) => {
  console.log('whisker tip x : ' + x + ' y: ' + y);
})
```

You can customize a whisker:

```js
const whisker = paper.get('whisker', {
  direction,      // "up" (default), "down", "left", "right"
  whiskerLength,  // as fraction of the side (default 0.7)
  requiredData,   // array of data fields that must be present in the other paper
  paperNumber,    // paper number to do this for (default is own paper number)
  color,          // color of the whisker (default "rgb(255, 0, 0)")
})
```

You can also change these attributes after the whisker was created:

```js
whisker.direction = "down"
whisker.color = "green"
```


If you don't need a whisker any more you can remove it:

```js
whisker.destroy()
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

When calibrating the camera the average size of the dots is stored. Dots which are significantly bigger than the paper
dots are recognized as markers.


You can request a list of all detected markers like this:

```js
const markers = await paper.get('markers');
```

Each marker has the following properties:

```js
{
  position: {x, y},  // global position
  color: [r, g, b],
  colorName,         // "red", "green", "blue" or "black"

  // properties which are only defined if marker is placed on a paper

  paperNumber, // number of the paper the marker is placed on
  positionOnPaper: {x, y} // normalized position of marker relative to paper origin
}
```

### Working with local position

The property `positionOnPaper` has a value range from 0 to 1. The top left corner has the coordinate (x = 0, y = 0) and
the bottom right corner has the coordinate (x = 1, y = 1). If you want to get the position of a marker on the local
canvas you have to multiply the x position with the width of the canvas and the y position with the height of the canvas.

```
var x = canvas.width * marker.positionOnPaper.x
var y = canvas.height * marker.positionOnPaper.y
```

### Get markers of paper

```
const paperNumber = await paper.get('number')
const markers = await paper.get('markers')
const markersOnPaper = markers.filter(marker => marker.paperNumber === paperNumber)
```