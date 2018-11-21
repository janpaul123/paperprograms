// geokit: contains

function project(lon, lat) {
  const lonDeg = lon;
  const latRad = lat * Math.PI / 180;
  const x = (lonDeg + 180) / 360;
  const y = (1 - (Math.log(Math.tan(latRad) + (1 / Math.cos(latRad))) / Math.PI)) / 2;
  return [x, y];
}

function unproject(x, y) {
  const lonDeg = x * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y)));
  const latDeg = latRad * 180 / Math.PI;
  return [lonDeg, latDeg];
}

When` {someone} wishes {map} is geomap containing bbox {bbox},
      {map} has width {width},
			{map} has height {height}`(({ map, bbox, width, height }) => {

  const [xLeft, yTop] = project(bbox.left, bbox.top);
  const [xRight, yBottom] = project(bbox.right, bbox.bottom);
  const [xCenter, yCenter] = [(xRight + xLeft) / 2, (yTop + yBottom) / 2];
  let [xRadius, yRadius] = [(xRight - xLeft) / 2, (yBottom - yTop) / 2];
  
  const pageRatio = width / height;
  const bboxRatio = xRadius / yRadius;
  if (pageRatio > bboxRatio) {
    xRadius *= pageRatio / bboxRatio;
  }
  else {
    yRadius *= bboxRatio / pageRatio;
  }
  
  const [xLeftNew, xRightNew] = [xCenter - xRadius, xCenter + xRadius];
  const [yTopNew, yBottomNew] = [yCenter - yRadius, yCenter + yRadius];
  const [left, top] = unproject(xLeftNew, yTopNew);
  const [right, bottom] = unproject(xRightNew, yBottomNew);
  log({left, right, top, bottom});
  Claim` ${map} is geomap of bbox ${{left, right, top, bottom}}`;
});
