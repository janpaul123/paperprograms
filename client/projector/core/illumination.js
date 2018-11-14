/*globals Wish, When, WithAll */

module.exports = function() {
  When` {someone} wishes {paper} has illumination {ill} `(({ paper }) => {
    Wish`${paper} has canvas with name ${'illumination'}`;
  });

  When` {paper} has canvas {canvas} with name ${'illumination'}`(({ paper, canvas }) => {
    WithAll`{someone} wishes ${paper} has illumination {ill}`(matches => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      matches.forEach(({ ill }) => {
        ill.draw(ctx);
      });
    });
  });
};

/*eslint no-shadow: 0*/
const rect = ({ x, y, width, height, fill, stroke }) => ({
  x,
  y,
  width,
  height,
  fill,
  stroke,
  render(ctx) {
    ctx.save();
    ctx.beginPath();
    if (this.stroke) ctx.strokeStyle = this.stroke;
    if (this.fill) ctx.fillStyle = this.fill;
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  },
});

const ellipse = ({ x, y, width, height, fill, stroke }) => ({
  x,
  y,
  width,
  height,
  fill,
  stroke,
  render(ctx) {
    ctx.save();
    ctx.beginPath();
    if (this.stroke) ctx.strokeStyle = this.stroke;
    if (this.fill) ctx.fillStyle = this.fill;
    ctx.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  },
});

const arc = ({ x, y, radius, startAngle, endAngle, anticlockwise, fill, stroke, lineWidth, lineCap, lineJoin }) => ({
  x,
  y,
  radius,
  startAngle,
  endAngle,
  anticlockwise,
  fill,
  stroke,
  lineWidth,
  lineCap,
  lineJoin,
  render(ctx) {
    ctx.save();
    ctx.beginPath();
    if (this.stroke) ctx.strokeStyle = this.stroke;
    if (this.fill) ctx.fillStyle = this.fill;
    if (this.lineWidth) ctx.lineWidth = this.lineWidth;
    if (this.linecap) ctx.lineCap = this.lineCap;
    if (this.lineJoin) ctx.lineJoin = this.lineJoin;
    ctx.arc(x, y, radius, startAngle, endAngle, anticlockwise);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  },
});

const polygon = ({ points, stroke, fill }) => ({
  points,
  stroke,
  fill,
  render(ctx) {
    ctx.beginPath();
    points.forEach(({ x, y }) => {
      ctx.lineTo(x, y);
    });
    ctx.closePath();
    if (this.stroke) ctx.strokeStyle = this.stroke;
    if (this.fill) ctx.fillStyle = this.fill;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  },
});

const fill = color => ({
  color,
  render(ctx) {
    ctx.fillStyle = color;
  },
});

const stroke = color => ({
  color,
  render(ctx) {
    ctx.strokeStyle = color;
  },
});

const lineStyle = (width, cap, join) => ({
  width,
  cap,
  join,
  render(ctx) {
    ctx.lineWidth = width;
    ctx.lineCap = cap;
    ctx.lineJoin = join;
  },
});

const text = ({ x, y, text, fill, size, fit = false }) => ({
  x,
  y,
  text,
  fill,
  size,
  fit,
  render(ctx) {
    ctx.save();
    ctx.font = `${this.size}px sans-serif`;
    if (this.fill) ctx.fillStyle = this.fill;
    if (this.fit) {
      const width = ctx.canvas.clientWidth;
      let textWidth = ctx.measureText(this.text).width;
      while (textWidth > width - 2) {
        this.size--;
        ctx.font = `${this.size}px sans-serif`;
        textWidth = ctx.measureText(this.text).width;
      }
    }
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore;
  },
});

const line = ({ from, to, stroke }) => ({
  from,
  to,
  stroke,
  render(ctx) {
    ctx.save();
    if (this.stroke) ctx.strokeStyle = this.stroke;
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  },
});

window.Shapes = {
  line,
  rect,
  ellipse,
  polygon,
  fill,
  stroke,
  text,
  arc,
  lineStyle,
};

window.Illumination = function(...args) {
  this.shapes = args;

  this.draw = ctx => {
    ctx.fillStyle = 'crimson';
    ctx.strokeStyle = 'crimson';
    ctx.lineWidth = 2;
    this.shapes.forEach(shape => {
      shape.render(ctx);
    });
  };
};
