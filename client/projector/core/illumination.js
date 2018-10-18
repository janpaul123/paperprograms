/*globals WithAll, When, Claim */

module.exports = function () {

  window.Illumination = function (...shapes) {

    this.shapes = shapes;
    this.fillStyle = "white";
    this.strokeStyle = "red";

    this.draw = (ctx) => {
      ctx.fillStyle = this.fillStyle;
      ctx.strokeStyle = this.strokeStyle;
      shapes.forEach(shape => {
        shape.draw(ctx);
      })
    }

  }

  When` {someone} wishes {paper} has illumination {ill} `(({ paper }) => {
    Wish`${paper} has canvas with name ${'illumination'}`
  });

  When` {paper} has canvas {canvas} with name ${'illumination'},
        {someone} wishes {paper} has illumination {ill}`(({ canvas, ill }) => {

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ill.draw(ctx);

    });

};
