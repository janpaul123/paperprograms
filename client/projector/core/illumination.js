/*globals you, WithAll, When, Claim, Wish */

module.exports = function() {
  const canvas = global.canvas;
  const ctx = canvas.getContext('2d');

  When` current time is {time} `(({ time }) => {
    WithAll` {paper} has corner points {points},
             {someone} wishes {paper} has outline with color {color}`(matches => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      matches.forEach(({ points, color }) => {
        ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${Math.abs(
          Math.sin(time / 200)
        ) + 0.5})`;

        ctx.beginPath();
        ctx.moveTo(points.topLeft.x, points.topLeft.y);
        ctx.lineTo(points.topRight.x, points.topRight.y);
        ctx.lineTo(points.bottomRight.x, points.bottomRight.y);
        ctx.lineTo(points.bottomLeft.x, points.bottomLeft.y);
        ctx.closePath();
        ctx.stroke();
      });
    });
  });

  When` {someone} wishes {paper} has outline `(({ paper }) => {
    Wish`${paper} has outline with color ${[255, 0, 0]}`;
  });
};
