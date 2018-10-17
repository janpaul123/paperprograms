/*globals When, Claim*/

module.exports = () => {
  When` {object} has corner points {points} `(({ object, points }) => {
    const width =
      (distance(points.topLeft, points.topRight) +
        distance(points.bottomLeft, points.bottomRight)) /
      2;
    const height =
      (distance(points.topRight, points.bottomRight) +
        distance(points.topLeft, points.bottomLeft)) /
      2;

    Claim` ${object} has width ${width}`;
    Claim` ${object} has height ${height}`;
  });

  When` {object} has corner points {points} `(({ object, points }) => {
    const centerPoint = { x: 0, y: 0 };

    Object.values(points).forEach(point => {
      centerPoint.y += point.x / 4;
      centerPoint.y += point.y / 4;
    });

    Claim` ${object} has center point ${centerPoint}`;
  });

  function distance(point1, point2) {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
  }
};
