/*globals When, Wish, Shapes, Illumination */

module.exports = () => {
  When` {paper} has width {width},
        {paper} has height {height},
        {someone} wishes {paper} has outline with color {color}`(
    ({ paper, width, height, color }) => {
      const ill = new Illumination(
        Shapes.rect({
          x: 0,
          y: 0,
          width: width - 1,
          height: height - 1,
          stroke: color,
          fill: 'transparent',
        })
      );
      Wish`${paper} has illumination ${ill}`;
    }
  );

  When` {paper} has width {width},
  {paper} has height {height},
  {someone} wishes {paper} has outline`(({ paper }) => {
    Wish`${paper} has outline with color ${'red'}`;
  });

  When` {paper} has changed code, 
        current time is {t} `(({ paper, t }) => {
    const color = `rgba(255, 0, 0, ${Math.sin(Math.abs(t / 500))})`;
    Wish`${paper} has outline with color ${color}`;
  });
};
