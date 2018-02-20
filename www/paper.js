(function(workerContext) {
  if (workerContext.paper) return;

  const messageCallbacks = {};
  let messageId = 0;
  workerContext.addEventListener('message', event => {
    messageCallbacks[event.data.messageId](event.data.receiveData);
  });

  workerContext.paper = {
    get(name, callback) {
      messageId++;
      workerContext.postMessage({ command: 'get', sendData: { name }, messageId });
      return new workerContext.Promise(resolve => {
        messageCallbacks[messageId] = data => {
          if (callback) callback(data.object);
          resolve(data.object);
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
  const maxLogLength = 100;
  let willFlushLogs = false;
  function flushLogs() {
    if (willFlushLogs) return;
    setTimeout(() => {
      willFlushLogs = false;
      workerContext.postMessage({ command: 'flushLogs', sendData: logs });
    }, 500);
    willFlushLogs = true;
  }
  function log(name, args) {
    const logData = {
      name,
      args: ['"[unknown]"'],
      lineNumber: 0,
      columnNumber: 0,
    };

    try {
      logData.args = args.map(arg => JSON.stringify(arg));
    } catch (_) {} // eslint-disable-line no-empty

    const stackData = new Error().stack.split('\n')[3].match(/\/program\..*/);
    if (stackData) {
      const splitStackData = stackData[0].slice(0, -1).split(':');
      logData.lineNumber = splitStackData[1];
      logData.columnNumber = splitStackData[2];
    }

    logs.push(logData);
    if (logs.length > maxLogLength) logs = logs.slice(-maxLogLength);
    flushLogs();
  }
  workerContext.console = {};
  workerContext.console.log = (...args) => log('console.log', args);
  workerContext.console.warn = (...args) => log('console.warn', args);
  workerContext.console.error = (...args) => log('console.error', args);
  workerContext.console.info = (...args) => log('console.info', args);
  flushLogs();
})(self);
