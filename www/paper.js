(function(workerContext) {
  workerContext.paper = {
    init(callback) {
      onmessage = function(event) {
        const { canvas, programNumber } = event.data;
        callback({ canvas, programNumber });
      };
    },
  };
})(self);
