/*globals WithAll, When, Claim, Wish */

module.exports = function() {
  When` {supporter} is a ${'supporter'}`(({ supporter }) => {
    Wish`${supporter} has canvas with name ${'whiskerCanvas'}`;
  });

  When` {supporter} is a ${'supporter'},
        {supporter} has canvas {canvas} with name ${'whiskerCanvas'}`(data => {
    const { supporter, canvas } = data;

    WithAll` {someone} wishes {whiskerPaper} has whisker that points {direction},
               {whiskerPaper} is on supporter ${supporter},
               {whiskerPaper} has corner points {points}`(matches => {
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      matches.forEach(({ points, direction, whiskerPaper }) => {
        ctx.strokeStyle = 'rgba(255, 0, 0)';
        const { topLeft, topRight, bottomLeft, bottomRight } = points;

        const { whiskerStart, whiskerEnd } =
          direction === 'up'
            ? drawWhisker(topLeft, topRight, ctx)
            : direction === 'right'
              ? drawWhisker(topRight, bottomRight, ctx)
              : direction === 'down'
                ? drawWhisker(bottomRight, bottomLeft, ctx)
                : direction === 'left' ? drawWhisker(bottomLeft, topLeft, ctx) : {};

        WithAll` {paper} has corner points {paperPoints},
                 {paper} is a ${'program'}`(paperMatches => {
          paperMatches.forEach(({ paper, paperPoints }) => {
            if (paper === whiskerPaper) {
              return;
            }
            if (intersectsPaper(whiskerStart, whiskerEnd, paperPoints)) {
              Claim`${whiskerPaper} points at ${paper}`;
            }
          });
        });
      });
    });
  });

  /* helper functions */

  function drawWhisker(p1, p2, ctx) {
    const { x: x1, y: y1 } = p1;
    const { x: x2, y: y2 } = p2;
    const whiskerStart = {
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2,
    };
    const whiskerEnd = {
      x: whiskerStart.x + (y2 - y1) / 4,
      y: whiskerStart.y - (x2 - x1) / 4,
    };
    ctx.beginPath();
    ctx.moveTo(whiskerStart.x, whiskerStart.y);
    ctx.lineTo(whiskerEnd.x, whiskerEnd.y);
    ctx.closePath();
    ctx.stroke();
    return { whiskerStart, whiskerEnd };
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
};
