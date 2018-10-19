/*globals When, Wish, Shapes */

const { Illumination } = window;

module.exports = function() {
  When`{someone} wishes {paper} is labelled {text}`(({ paper, text }) => {
    const ill = new Illumination(
      Shapes.text({
        x: 3,
        y: 25,
        text,
        fill: 'crimson',
        size: 25,
        fit: true,
      })
    );
    Wish`${paper} has illumination ${ill}`;
  });
};
