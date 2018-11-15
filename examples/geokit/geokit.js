// geokit

const images = {};

function deg2num(lon, lat, zoom) {
  const n = 2 ** zoom;
  const latRad = lat * Math.PI / 180;
  const xtile = n * (lon + 180) / 360;
  const ytile = n * (1 - (Math.log(Math.tan(latRad) + (1 / Math.cos(latRad))) / Math.PI)) / 2;
  return [xtile, ytile];
}

When` {map} is geomap of bbox {bbox},
      {map} has width {width},
			{map} has height {height}`(({ map, bbox, width, height }) => {

  let zoom = Math.log(360 / (bbox.right - bbox.left)) / Math.log(2);
  zoom = Math.ceil(zoom + width / 200 - 1);
  log(zoom);
  zoom = Math.min(zoom, 17);
  
  let [xtileLeft, ytileTop] = deg2num(bbox.left, bbox.top, zoom);
  let [xtileRight, ytileBottom] = deg2num(bbox.right, bbox.bottom, zoom);

  let tilesize = width / (xtileRight - xtileLeft);
  log(xtileLeft, ytileTop, xtileRight, ytileBottom, tilesize);

  Wish` ${map} has canvas with name ${'map'}`;
  When` ${map} has canvas {canvas} with name ${'map'}`(({ canvas }) => {
    const ctx = canvas.getContext('2d');

    for (let xtile = Math.floor(xtileLeft); xtile <= Math.floor(xtileRight); xtile++) {
      for (let ytile = Math.floor(ytileTop); ytile <= Math.floor(ytileBottom); ytile++) {
        const url = `https://tile.openstreetmap.org/${zoom}/${xtile}/${ytile}.png`;

        const id = `${map}:${zoom}:${xtile}:${ytile}`;
        const image = images[id] || new Image();
        if (image.src !== url) {
          image.src = url;
        }
        images[id] = image;

        ctx.drawImage(image, tilesize * (xtile - xtileLeft), tilesize * (ytile - ytileTop), tilesize, tilesize);
      }
    }
  });
});
