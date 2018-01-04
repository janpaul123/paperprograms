(function(workerContext) {
  const messageCallbacks = {};
  let messageId = 0;

  workerContext.onmessage = event => {
    messageCallbacks[event.data.messageId](event.data.receiveData);
  };

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
  };
})(self);
