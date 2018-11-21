/*globals When */

module.exports = function() {
  When` {someone} wishes part of camera snapshot {snapshot} with corner points {corners} is drawn on canvas {target}`
    (({ snapshot, corners, target }) => {
      snapshot.drawOnCanvas(corners, target);
  });
};
