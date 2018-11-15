// rotational dial

function normalize({x, y}) {
  const length = Math.sqrt(x * x + y * y);
  return { x: x / length, y: y / length };
}
  
function angleBetween(v1, v2) {
  return (Math.atan2(v2.y, v2.x) - Math.atan2(v1.y, v1.x) + Math.PI * 2) % (Math.PI * 2);
}
  
function dialShape(x, y, radius, startAngle, endAngle, alpha) {
  return Shapes.arc({
    x, y,
    radius,
    startAngle, endAngle, anticlockwise: false,
    fill: 'transparent',
    stroke: `rgba(255, 69, 0, ${alpha})`, lineWidth: 20, lineCap: 'round', lineJoin: 'round'
  });
}

function inside(point, vs) {
  // ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
  let x = point.x, y = point.y;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].x, yi = vs[i].y;
    const xj = vs[j].x, yj = vs[j].y;
    const intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
  
When` ${you} has corner points {corners},
      ${you} has width {paperWidth},
      ${you} has height {paperHeight}`(({ corners, paperWidth, paperHeight }) => {
  const top = {
    x: (corners.topLeft.x + corners.topRight.x) / 2,
    y: (corners.topLeft.y + corners.topRight.y) / 2
  };
  const mid = {
    x: (corners.topLeft.x + corners.topRight.x + corners.bottomLeft.x + corners.bottomRight.x) / 4,
    y: (corners.topLeft.y + corners.topRight.y + corners.bottomLeft.y + corners.bottomRight.y) / 4,
  };
  const dir = normalize({
    x: top.x - mid.x,
    y: top.y - mid.y
  });
  const up = { x: 0, y: -1 };
  const angle = angleBetween(up, dir);
  const value = Math.round(angle / (Math.PI * 2) * 100);
  const size = 30;
  const ill = new Illumination(
    Shapes.text({
      x: paperWidth / 2 - size / 2, y: paperHeight / 2 + size / 3,
      text: value,
      fill: 'orange',
      size, fit: true,
    }),
    dialShape(paperWidth / 2, paperHeight / 2, size, 0, Math.PI * 2, 0.3),
    dialShape(paperWidth / 2, paperHeight / 2, size, -angle - Math.PI / 2, -Math.PI / 2, 1)
  );
  Wish` ${you} has illumination ${ill}`;
  
  Claim` ${you} has numerical value ${value}`;
  
  WithAll` {paper} has corner points {paperPoints},
           {paper} is a ${'program'}`(paperMatches => {
    for (let [index, {paper, paperPoints}] of paperMatches.entries()) {
      if (inside(mid, [paperPoints.topLeft, paperPoints.topRight, paperPoints.bottomRight, paperPoints.bottomLeft, paperPoints.topLeft])) {
        Claim` ${paper} has numerical value ${value}`;
        break;
      }
    }
  });
});
