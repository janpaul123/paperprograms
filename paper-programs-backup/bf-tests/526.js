// test
// Keywords: start, begin, new, hello world
// =============================== //
/* 
   Program Dependencies: N/A
   Recommended Programs: 
   Program Description: Contains the required and possible code blocks 
   necessary to run a program on the Board or Projector.
*/

importScripts('paper.js');
// importScripts('p5.js');

(async () => {

  //----------------------------------------------------------------------
  // Board code
  //----------------------------------------------------------------------

  //----------------------------------------------------------------------
  // Projector code
  //----------------------------------------------------------------------

  const window = await paper.get('canvas');

  // // Draw "Hello world" on the canvas.
  // const ctx = canvas.getContext('2d');
  // ctx.font = '20px sans-serif';
  // ctx.textAlign = 'center';
  // ctx.fillStyle = 'rgb(255,0,0)';
  // ctx.fillText('Hello', canvas.width / 2, canvas.height / 2 - 10);
  // ctx.fillStyle = 'rgb(0,255,0)';
  // ctx.fillText('world', canvas.width / 2, canvas.height / 2 + 20);

  setInterval(async () => {
    function setup() {
      createCanvas(400, 400);
    }

    function draw() {
      background(220);
      ellipse(50,50,80,80);
    }
  }, 100);
  

}
)();