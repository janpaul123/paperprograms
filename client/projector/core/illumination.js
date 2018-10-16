/*globals you, When, Claim, Wish */

module.exports = function() {

  const canvas = global.canvas;
  const ctx = canvas.getContext('2d');

  When `{paper} has corner points {points},
        current time is {time}` (({points, time}) => {




    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = `rgb(${Math.abs(Math.sin(time / 100)) * 100 + 100}, 0, 100)`;
    ctx.beginPath();
    ctx.moveTo(points.topLeft.x, points.topLeft.y);
    ctx.lineTo(points.topRight.x, points.topRight.y);
    ctx.lineTo(points.bottomRight.x, points.bottomRight.y);
    ctx.lineTo(points.bottomLeft.x, points.bottomLeft.y);
    ctx.closePath();
    ctx.stroke();
  });
};
