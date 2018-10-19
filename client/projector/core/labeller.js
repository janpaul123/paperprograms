/*globals When, Wish */

const { Illumination } = window;

module.exports = function() {
  When`{someone} wishes {paper} is labelled {text}`(({ paper, text }) => {
    const ill = new Illumination().text({
      x: 0,
      y: 30,
      text,
      fill: 'dodgerblue',
      font: '30px sans-serif',
    });
    Wish`${paper} has illumination ${ill}`;
  });
};
