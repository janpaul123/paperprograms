import { forwardProjectionMatrixForPoints, projectPoint } from '../utils';

// https://beta.observablehq.com/@shaunlebron/texture-drawing-for-html-canvas

export function fillQuadTex(ctx, src, dst, opts) {
  opts = opts || {};
  const tiles = opts.tiles || 10;

  const projectionSrc = forwardProjectionMatrixForPoints(src);
  const projectionDst = forwardProjectionMatrixForPoints(dst);
  const srcRowCol = (r, c) => projectPoint({ x: c / tiles, y: r / tiles }, projectionSrc);
  const dstRowCol = (r, c) => projectPoint({ x: c / tiles, y: r / tiles }, projectionDst);

  const pad = 0.03; // we add padding to remove tile seams

  const topTri = (r, c, p) => [
    /*
      0-----1
       \    |
         \  |  top
           \|
            2
    */
    p(r - pad, c - pad * 2), // extra diagonal padding
    p(r - pad, c + 1 + pad),
    p(r + 1 + pad * 2, c + 1 + pad), // extra diagonal padding
  ];
  const botTri = (r, c, p) => [
    /*
      2
      |\
      |  \   bottom
      |    \
      1-----0
    */
    p(r + 1 + pad, c + 1 + pad),
    p(r + 1 + pad, c - pad),
    p(r - pad, c - pad),
  ];

  // clip to erase the external padding
  ctx.save();
  ctx.beginPath();
  for (let { x, y } of dst) {
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.clip();

  // draw triangles
  for (let r = 0; r < tiles; r++) {
    for (let c = 0; c < tiles; c++) {
      fillTriTex(ctx, topTri(r, c, srcRowCol), topTri(r, c, dstRowCol));
      fillTriTex(ctx, botTri(r, c, srcRowCol), botTri(r, c, dstRowCol));
    }
  }
  ctx.restore();
}

export function fillTriTex(ctx, src, dst) {
  ctx.beginPath();
  for (let { x, y } of dst) {
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  const [[x0, y0], [x1, y1], [x2, y2]] = dst.map(({ x, y }) => [x, y]);
  const [[u0, v0], [u1, v1], [u2, v2]] = src.map(({ x, y }) => [x, y]);
  fillTexPath(ctx, x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2);
}

// from: https://github.com/mrdoob/three.js/blob/r91/examples/js/renderers/CanvasRenderer.js#L917
// math: http://extremelysatisfactorytotalitarianism.com/blog/?p=2120
function fillTexPath(ctx, x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2) {
  let a, b, c, d, e, f, det, idet;
  (x1 -= x0), (y1 -= y0);
  (x2 -= x0), (y2 -= y0);
  (u1 -= u0), (v1 -= v0);
  (u2 -= u0), (v2 -= v0);
  det = u1 * v2 - u2 * v1;
  if (det === 0) return;
  idet = 1 / det;
  a = (v2 * x1 - v1 * x2) * idet;
  b = (v2 * y1 - v1 * y2) * idet;
  c = (u1 * x2 - u2 * x1) * idet;
  d = (u1 * y2 - u2 * y1) * idet;
  e = x0 - a * u0 - c * v0;
  f = y0 - b * u0 - d * v0;
  ctx.save();
  ctx.transform(a, b, c, d, e, f);
  ctx.fill();
  ctx.restore();
}
