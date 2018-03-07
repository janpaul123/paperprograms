import * as createRegl from 'regl';

export default function simpleBlobDetector(sigma, dotThreshold, video) {
  const outCanvas = document.createElement('canvas');
  outCanvas.width = 1920;
  outCanvas.height = 1080;
  outCanvas.style.width = '960px';
  outCanvas.style.height = '540px';
  document.body.appendChild(outCanvas);

  const regl = createRegl({
    canvas: outCanvas,
    attributes: { preserveDrawingBuffer: true },
    extensions: ['OES_texture_float'],
  });

  const gaussian = (sigma, x) =>
    1 / Math.sqrt(2 * Math.PI * sigma * sigma) * Math.exp(-(x * x) / (2 * sigma * sigma));

  // const sigma = 12; // Initial scale (of blobs to detect?)

  // Having 1 Gaussian kernel is unwieldy at big sigma, so
  // separate it into an x-kernel and y-kernel and do 2 passes.

  const sigma1D = sigma / 2;
  const kernelSize1D = 2 * Math.ceil(3 * sigma1D) + 1;
  const kernelRadius1D = Math.floor(kernelSize1D / 2);
  let kernel1D = [];
  let sum = 0;
  for (let dx = -kernelRadius1D; dx <= kernelRadius1D; dx++) {
    const v = gaussian(sigma1D, dx);
    kernel1D.push(v);
    sum += v;
  }
  kernel1D = kernel1D.map(v => v / sum);

  const common = {
    vert: `
precision mediump float;
attribute vec2 position;
varying vec2 uv;
void main () {
  uv = position;
  gl_Position = vec4(1.0 - 2.0 * position, 0, 1);
}`,
    attributes: {
      position: [-2, 0, 0, -2, 2, 2],
    },
    count: 3,
  };

  const gaussian1DFilter = regl({
    ...common,
    frag: `
precision mediump float;

uniform sampler2D texture;
uniform vec2 textureSize;
uniform vec2 dir;

varying vec2 uv;

void main () {
  vec4 color = texture2D(texture, uv).argb;

  vec2 onePixel = vec2(1.0, 1.0) / textureSize;

  vec4 sum = vec4(0.0);
  ${(() => {
    const terms = [];
    for (let dx = -kernelRadius1D; dx <= kernelRadius1D; dx++) {
      const i = terms.length;
      terms.push(
        `sum += texture2D(texture, uv + onePixel * dir * ${dx.toFixed(1)}) * ${kernel1D[i].toFixed(
          10
        )};`
      );
    }
    return terms.join('\n');
  })()}

  gl_FragColor = sum;
}`,
    uniforms: {
      texture: regl.prop('texture'),
      dir: regl.prop('dir'),
      textureSize: [1920, 1080],
    },
  });

  const idFilter = regl({
    ...common,
    frag: `
precision mediump float;
uniform sampler2D texture;
varying vec2 uv;

void main () {
  vec4 me = texture2D(texture, uv);
  gl_FragColor = me;
}`,
    uniforms: {
      texture: regl.prop('texture'),
    },
  });

  const laplacianFilter = regl({
    ...common,
    frag: `
precision mediump float;
uniform sampler2D texture;
uniform vec2 textureSize;
uniform float sigma;
varying vec2 uv;

float gray (vec4 color) {
  return 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
}

void main () {
  float sum = 0.0;

  vec2 onePixel = vec2(1.0, 1.0) / textureSize;
  for (int dx = -1; dx <= 1; dx++) {
    for (int dy = -1; dy <= 1; dy++) {
      float pixel = gray(texture2D(texture, uv + onePixel * vec2(dx, dy)));
      if (dx == 0 && dy == 0) {
        sum += 8.0 * pixel;
      } else {
        sum += -1.0 * pixel;
      }
    }  
  }
  sum *= sigma * sigma;

  gl_FragColor = vec4(sum, sum, sum, 1.0);
}`,
    uniforms: {
      texture: regl.prop('texture'),
      sigma,
      textureSize: [1920, 1080],
    },
  });

  const maximumFilter = regl({
    ...common,
    frag: `
precision mediump float;

uniform sampler2D texture;
uniform sampler2D videoTexture;
uniform vec2 textureSize;

uniform float sigma;
varying vec2 uv;

void main () {
  float me = texture2D(texture, uv).r;
  if (me > ${dotThreshold.toFixed(5)}) {
    gl_FragColor = vec4(0.0, 0.0, 1.0, 0.5);
    return;
  }

  vec2 onePixel = vec2(1.0, 1.0) / textureSize;

  int darkerThan = 0;
  for (int dx = -1; dx <= 1; dx++) {
    for (int dy = -1; dy <= 1; dy++) {
      if (dx != 0 || dy != 0) {
        float neighbor = texture2D(texture, uv + onePixel * vec2(dx, dy)).r;
        if (neighbor < me) darkerThan += 1;
      }
    }  
  }

  if (darkerThan == 8) {
    vec3 color = texture2D(videoTexture, vec2(1.0 - uv.x, 1.0 - uv.y)).rgb;
    gl_FragColor = vec4(color, 1.0);
  } else {
    gl_FragColor = vec4(me, me, me, 0.5);
  }
}`,
    uniforms: {
      videoTexture: regl.prop('videoTexture'),
      texture: regl.prop('texture'),
      sigma,
      textureSize: [1920, 1080],
    },
  });

  const createFramebuffer = () =>
    regl.framebuffer({
      width: 1920,
      height: 1080,
      colorFormat: 'rgba', // TODO: Can we get rid of the extra channels?
      colorType: 'float',
    });

  const gaussianXFramebuffer = createFramebuffer();
  const gaussianYFramebuffer = createFramebuffer();
  const laplacianFramebuffer = createFramebuffer();

  const texture = regl.texture(video);
  const readBuffer = new Uint8Array(1920 * 1080 * 4);
  return {
    sigma,
    dotThreshold,
    detectBlobs() {
      // This is the slowest GPU operation -- 10-20 FPS cost.
      const videoTexture = texture.subimage(video);
      // All subsequent operations are more like 3 FPS each.
      gaussianXFramebuffer.use(() => {
        regl.clear({
          color: [0, 0, 0, 255],
          depth: 1,
        });
        gaussian1DFilter({ texture: videoTexture, dir: [1.0, 0.0] });
      });
      gaussianYFramebuffer.use(() => {
        regl.clear({
          color: [0, 0, 0, 255],
          depth: 1,
        });
        gaussian1DFilter({ texture: gaussianXFramebuffer, dir: [0.0, 1.0] });
      });
      laplacianFramebuffer.use(() => {
        regl.clear({
          color: [0, 0, 0, 255],
          depth: 1,
        });
        laplacianFilter({ texture: gaussianYFramebuffer });
      });

      regl.clear({
        color: [0, 0, 0, 255],
        depth: 1,
      });
      maximumFilter({ texture: laplacianFramebuffer, videoTexture });

      const keyPoints = [];

      const snapshot = regl.read(readBuffer);
      for (var y = 0; y < 1080; y++) {
        for (var x = 0; x < 1920; x++) {
          const idx = y * 1920 * 4 + x * 4;
          const opacity = readBuffer[idx + 3];
          if (opacity < 255) {
            // Throw out anything that isn't a 1-opacity (max) point.
            continue;
          }

          let size = sigma;
          if (x + size >= 1920 || x - size <= 0 || y + size >= 1080 || y - size <= 0) {
            // TODO: Try to salvage these edge points.
            continue;
          }

          const [r, g, b] = [readBuffer[idx], readBuffer[idx + 1], readBuffer[idx + 2]];
          keyPoints.push({ pt: { x, y }, size, color: [r, g, b, 255] });
        }
      }

      return keyPoints;
    },
    dispose() {
      regl.destroy();
      outCanvas.remove();
    },
  };
}
