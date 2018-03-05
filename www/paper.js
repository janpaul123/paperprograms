(function(workerContext) {
  if (workerContext.paper) return;

  const messageCallbacks = {};
  let messageId = 0;
  workerContext.addEventListener('message', event => {
    messageCallbacks[event.data.messageId](event.data.receiveData);
  });

  workerContext.paper = {
    get(name, data, callback) {
      if (typeof data === 'function') {
        callback = data;
        data = {};
      } else if (typeof data !== 'object') {
        data = {};
      }

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

  let logs = [];
  let willFlushLogs = false;
  function flushLogs() {
    if (willFlushLogs) return;
    setTimeout(() => {
      willFlushLogs = false;
      workerContext.postMessage({ command: 'flushLogs', sendData: logs });
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
      log('Error', [event.reason.message], event.reason.stack.split('\n')[1]);
    }
  });

  workerContext.paper.whenPointsAt = async ({
    direction,
    whiskerLength,
    paperNumber,
    requiredData,
    callback,
  } = {}) => {
    whiskerLength = whiskerLength || 0.7;
    paperNumber = paperNumber || (await workerContext.paper.get('number'));
    requiredData = requiredData || [];
    const supporterCanvas = await workerContext.paper.get('supporterCanvas', { id: 'whisker' });
    const supporterCtx = supporterCanvas.getContext('2d');
    let pointAtData = null;

    // Adapted from https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
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
    function intersectsPaper(whiskerStart, whiskerEnd, paper) {
      return (
        (intersects(whiskerStart, whiskerEnd, paper.points.topLeft, paper.points.topRight) ||
          intersects(whiskerStart, whiskerEnd, paper.points.topRight, paper.points.bottomRight) ||
          intersects(whiskerStart, whiskerEnd, paper.points.bottomRight, paper.points.bottomLeft) ||
          intersects(whiskerStart, whiskerEnd, paper.points.bottomLeft, paper.points.topLeft)) &&
        requiredData.every(name => paper.data[name] !== undefined)
      );
    }

    setInterval(async () => {
      const papers = await workerContext.paper.get('papers');
      const points = papers[paperNumber].points;

      let segment = [points.topLeft, points.topRight];
      if (direction === 'right') segment = [points.topRight, points.bottomRight];
      if (direction === 'down') segment = [points.bottomRight, points.bottomLeft];
      if (direction === 'left') segment = [points.bottomLeft, points.topLeft];

      const whiskerStart = {
        x: (segment[0].x + segment[1].x) / 2,
        y: (segment[0].y + segment[1].y) / 2,
      };
      const whiskerEnd = {
        x: whiskerStart.x + (segment[1].y - segment[0].y) * whiskerLength,
        y: whiskerStart.y - (segment[1].x - segment[0].x) * whiskerLength,
      };

      if (
        !pointAtData ||
        !papers[pointAtData.paperNumber] ||
        // Try keeping `pointAtData` stable if possible.
        !intersectsPaper(whiskerStart, whiskerEnd, papers[pointAtData.paperNumber])
      ) {
        let newPointAtData = null;
        Object.keys(papers).forEach(otherPaperNumber => {
          if (otherPaperNumber === paperNumber) return;
          if (intersectsPaper(whiskerStart, whiskerEnd, papers[otherPaperNumber])) {
            newPointAtData = { paperNumber: otherPaperNumber, paper: papers[otherPaperNumber] };
          }
        });
        if (newPointAtData !== pointAtData) {
          pointAtData = newPointAtData;
          if (callback) callback(pointAtData);
        }
      }

      supporterCtx.clearRect(0, 0, supporterCanvas.width, supporterCanvas.height);
      supporterCtx.fillStyle = supporterCtx.strokeStyle = pointAtData
        ? 'rgb(0, 255, 0)'
        : 'rgb(255, 0, 0)';
      supporterCtx.beginPath();
      supporterCtx.moveTo(whiskerStart.x, whiskerStart.y);
      supporterCtx.lineTo(whiskerEnd.x, whiskerEnd.y);
      supporterCtx.stroke();

      const dotFraction = (Date.now() / 600) % 1;
      supporterCtx.beginPath();
      supporterCtx.arc(
        whiskerEnd.x * dotFraction + whiskerStart.x * (1 - dotFraction),
        whiskerEnd.y * dotFraction + whiskerStart.y * (1 - dotFraction),
        2,
        0,
        2 * Math.PI
      );
      supporterCtx.fill();
      supporterCtx.commit();
    }, 10);
  };
})(self);
