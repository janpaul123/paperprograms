/*globals When, Wish */

module.exports = function() {
  When` {supporter} is a ${'supporter'}`(({ supporter }) => {
    Wish`${supporter} has canvas with name ${'cornerShadows'}`;
  });
  
  When` {supporter} is a ${'supporter'},
        {supporter} has canvas {canvas} with name ${'cornerShadows'},
        {supporter} has corner shapes {cornerShapes}`(data => {
    const { canvas, cornerShapes, width } = data;
  
    if (cornerShapes.points.length === 0) {
      return;
    }

    const ctx = canvas.getContext('2d');
    canvas.style.zIndex = '1000';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.lineJoin = 'miter';
    ctx.lineCap = 'square';
    ctx.lineWidth = cornerShapes.width;
    cornerShapes.points.forEach(([start, middle, end]) => {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(middle.x, middle.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    });
  });
};
