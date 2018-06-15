import Matrix from 'node-matrices';
import { projectPoint } from '../utils';
import { fillQuadTex, fillTriTex } from './canvasUtils';
import Whisker from './whisker';

(function(workerContext) {
  if (workerContext.paper) return;

  const messageCallbacks = {};
  let messageId = 0;
  workerContext.addEventListener('message', event => {
    messageCallbacks[event.data.messageId](event.data.receiveData);
  });

  workerContext.paper = {
    get(name, data, callback) {
      if (name === 'whisker') {
        const whisker = new Whisker(data);

        if (callback) {
          callback(whisker);
          return;
        }
        return whisker;
      }

      if (typeof data === 'function') {
        callback = data;
        data = {};
      } else if (typeof data !== 'object') {
        data = {};
      }

      if (name === 'supporterCanvas') {
        return getSupporterCanvas(data, callback);
      } else if (name === 'canvas') {
        return getCanvas(data, callback);
      }

      return this._get(name, data, callback);
    },

    _get(name, data, callback) {
      messageId++;
      workerContext.postMessage({ command: 'get', sendData: { name, data }, messageId });
      return new workerContext.Promise(resolve => {
        messageCallbacks[messageId] = receivedData => {
          if (callback) callback(receivedData.object);
          resolve(receivedData.object);
        };
      });
    },

    set(name, data, callback) {
      messageId++;
      workerContext.postMessage({ command: 'set', sendData: { name, data }, messageId });
      return new workerContext.Promise(resolve => {
        messageCallbacks[messageId] = () => {
          if (callback) callback();
          resolve();
        };
      });
    },
  };

  const supporterCanvasesById = {};

  function getSupporterCanvas(data, callback) {
    const id = data.id || 'default';

    return new workerContext.Promise(resolve => {
      const cachedCanvas = supporterCanvasesById[id];
      if (cachedCanvas) {
        resolve(cachedCanvas);
      } else {
        resolve(
          workerContext.paper._get('supporterCanvas', data, callback).then(canvas => {
            supporterCanvasesById[id] = canvas;
            return canvas;
          })
        );
      }
    });
  }

  const paperCanvasesById = {};

  function getCanvas(data, callback) {
    return new workerContext.Promise(resolve => {
      if (data.number) {
        resolve(data.number);
      } else {
        resolve(workerContext.paper.get('number'));
      }
    }).then(id => {
      const cachedCanvas = paperCanvasesById[id];
      if (cachedCanvas) {
        return cachedCanvas;
      }

      return workerContext.paper._get('canvas', data, callback).then(canvas => {
        paperCanvasesById[id] = canvas;
        return canvas;
      });
    });
  }

  let logs = [];
  let willFlushLogs = false;

  function flushLogs() {
    if (willFlushLogs) return;
    setTimeout(() => {
      willFlushLogs = false;
      workerContext.postMessage({ command: 'flushLogs', sendData: logs });
      logs = [];
    }, 50);
    willFlushLogs = true;
  }

  function log(name, args, stackLine) {
    const logData = {
      name,
      args: ['"[unknown]"'],
      lineNumber: 0,
      columnNumber: 0,
      filename: 'program',
      timestamp: Date.now(),
    };

    try {
      logData.args = args.map(arg => JSON.stringify(arg));
    } catch (_) {} // eslint-disable-line no-empty

    const stackData = (stackLine || new Error().stack.split('\n')[3]).match(/\/program\..*/);
    if (stackData) {
      const splitStackData = stackData[0].slice(0, -1).split(':');
      logData.lineNumber = splitStackData[1];
      logData.columnNumber = splitStackData[2];
    }

    logs.push(logData);
    flushLogs();
  }

  workerContext.console = {};
  workerContext.console.log = (...args) => log('console.log', args);
  workerContext.console.warn = (...args) => log('console.warn', args);
  workerContext.console.error = (...args) => log('console.error', args);
  workerContext.console.info = (...args) => log('console.info', args);

  workerContext.addEventListener('unhandledrejection', event => {
    if (event.reason instanceof Error) {
      log('Error', [event.reason.message], (event.reason.stack || '').split('\n')[1]);
    }
  });

  function normalizePoints(points) {
    if (points.topLeft) {
      const { topLeft, topRight, bottomRight, bottomLeft } = points;
      return [topLeft, topRight, bottomRight, bottomLeft];
    }
    return points;
  }

  workerContext.paper.drawFromCamera = (ctx, camera, srcPoints, dstPoints) => {
    srcPoints = normalizePoints(srcPoints);
    dstPoints = normalizePoints(dstPoints);

    const forwardProjection = new Matrix(camera.forwardProjectionData);
    srcPoints = srcPoints.map(p => projectPoint(p, forwardProjection));

    ctx.fillStyle = ctx.createPattern(camera.cameraImage, 'no-repeat');
    if (srcPoints.length === 3) {
      fillTriTex(ctx, srcPoints, dstPoints);
    } else if (srcPoints.length === 4) {
      fillQuadTex(ctx, srcPoints, dstPoints);
    }
  };

  // TODO: remove paper.whenPointsAt
  workerContext.paper.whenPointsAt = async ({
    direction,
    whiskerLength,
    paperNumber,
    requiredData,
    callback,
    whiskerPointCallback,
  } = {}) => {
    const whisker = new Whisker({
      direction,
      whiskerLength,
      paperNumber,
      requiredData,
    });

    if (callback) {
      whisker.on('paperAdded', callback);
      whisker.on('paperRemoved', () => callback(null
      ));
    }

    if (whiskerPointCallback) {
      whisker.on('whiskerMoved', whiskerPointCallback);
    }
  };
})(self);
