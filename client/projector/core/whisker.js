/*globals you, WithAll, When, Claim, Wish */

module.exports = function () {

  function drawWhisker(p1, p2, ctx) {
    const { x: x1, y: y1 } = p1;
    const { x: x2, y: y2 } = p2;
    const whiskerStart = {
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2
    }
    const whiskerEnd = {
      x: whiskerStart.x + ((y2 - y1) / 4),
      y: whiskerStart.y - ((x2 - x1) / 4)
    }
    ctx.beginPath();
    ctx.moveTo(whiskerStart.x, whiskerStart.y);
    ctx.lineTo(whiskerEnd.x, whiskerEnd.y);
    ctx.closePath();
    ctx.stroke();
    return { whiskerStart, whiskerEnd };
  }

  function drawBorder(points, ctx) {
    ctx.beginPath();
    ctx.moveTo(points.topLeft.x, points.topLeft.y);
    ctx.lineTo(points.topRight.x, points.topRight.y);
    ctx.lineTo(points.bottomRight.x, points.bottomRight.y);
    ctx.lineTo(points.bottomLeft.x, points.bottomLeft.y);
    ctx.closePath();
    ctx.stroke();
  }

  function intersects(v1, v2, v3, v4) {
    const det = (v2.x - v1.x) * (v4.y - v3.y) - (v4.x - v3.x) * (v2.y - v1.y);
    if (det === 0) {
      return false;
    } else {
      const lambda = ((v4.y - v3.y) * (v4.x - v1.x) + (v3.x - v4.x) * (v4.y - v1.y)) / det;
      const gamma = ((v1.y - v2.y) * (v4.x - v1.x) + (v2.x - v1.x) * (v4.y - v1.y)) / det;
      return 0 < lambda && lambda < 1 && (0 < gamma && gamma < 1);
    }
  }

  function intersectsPaper(whiskerStart, whiskerEnd, points) {
    return (
      intersects(whiskerStart, whiskerEnd, points.topLeft, points.topRight) ||
      intersects(whiskerStart, whiskerEnd, points.topRight, points.bottomRight) ||
      intersects(whiskerStart, whiskerEnd, points.bottomRight, points.bottomLeft) ||
      intersects(whiskerStart, whiskerEnd, points.bottomLeft, points.topLeft)
    );
  }

  const canvas = global.canvas;
  const ctx = canvas.getContext('2d');

  When` current time is {time} `(({ time }) => {
    WithAll` {whiskerPaper} has corner points {points},
             {someone} wishes {whiskerPaper} has whisker that points {direction}` (matches => {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        matches.forEach(({ points, direction, whiskerPaper }) => {

          ctx.strokeStyle = 'rgba(255, 0, 0)';
          const { topLeft, topRight, bottomLeft, bottomRight } = points;

          // drawBorder(points, ctx);

          const { whiskerStart, whiskerEnd } =
            direction === 'up' ? drawWhisker(topLeft, topRight, ctx) :
              direction === 'right' ? drawWhisker(topRight, bottomRight, ctx) :
                direction === 'down' ? drawWhisker(bottomRight, bottomLeft, ctx) :
                  direction === 'left' ? drawWhisker(bottomLeft, topLeft, ctx) :
                    {};

          WithAll` {paper} has corner points {points}`(matches => {
            
            matches.forEach(({ paper, points }) => {
              if (paper === whiskerPaper) { return; }
              if (intersectsPaper(whiskerStart, whiskerEnd, points)) {
                Claim`${whiskerPaper} points at ${paper}`
              }
            });
          });
        });
      });
  });

};
