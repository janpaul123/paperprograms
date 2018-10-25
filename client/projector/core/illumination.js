/*globals When, Wish */

module.exports = function() {
  When` {someone} wishes {paper} has illumination {ill} `(({ paper }) => {
    Wish`${paper} has canvas with name ${'illumination'}`;
  });

  When` {paper} has canvas {canvas} with name ${'illumination'},
        {someone} wishes {paper} has illumination {ill}`(({ canvas, ill }) => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ill.draw(ctx);
  });
};

window.Illumination = function() {
  this.commands = [];

  this.addMethod = (name, args) => {
    this.commands.push({
      type: 'method',
      name,
      args,
    });
  };

  this.addAssert = (name, value) => {
    this.commands.push({
      type: 'assert',
      name,
      value,
    });
  };

  this.save = () => {
    this.addMethod('save', []);
    return this;
  };
  this.restore = () => {
    this.addMethod('restore', []);
    return this;
  };
  this.translate = translation => {
    this.addMethod('translate', translation);
    return this;
  };
  this.fill = color => {
    this.addAssert('fillStyle', color);
    return this;
  };
  this.stroke = color => {
    this.addAssert('strokeStyle', color);
    return this;
  };

  this.rect = ({ x, y, width, height, overlay = true, stroke, fill }) => {
    this.addMethod('save', []);
    overlay && this.addMethod('beginPath', []);
    stroke && this.addAssert('strokeStyle', stroke);
    fill && this.addAssert('fillStyle', fill);
    this.addMethod('rect', [x, y, width, height]);
    this.addMethod('fill', []);
    this.addMethod('stroke', []);
    this.addMethod('restore', []);
    return this;
  };

  this.text = ({ x, y, text, font = '32px sans-serif', fill }) => {
    this.addMethod('save', []);
    this.addAssert('font', font);
    fill && this.addAssert('fill', fill);
    this.addMethod('fillText', [text, x, y]);
    this.addMethod('restore', []);
    return this;
  };

  this.ellipse = ({ x, y, width, height, overlay = true, stroke, fill }) => {
    this.addMethod('save', []);
    overlay && this.addMethod('beginPath', []);
    stroke && this.addAssert('strokeStyle', stroke);
    fill && this.addAssert('fillStyle', fill);
    this.addMethod('ellipse', [x, y, width / 2, height / 2, 0, 0, 2 * Math.PI]);
    this.addMethod('fill', []);
    this.addMethod('stroke', []);
    this.addMethod('restore', []);
    return this;
  };

  this.line = ({ from, to, overlay = true, stroke }) => {
    this.addMethod('save', []);
    overlay && this.addMethod('beginPath', []);
    stroke && this.addAssert('strokeStyle', stroke);
    this.addMethod('moveTo', from);
    this.addMethod('lineTo', to);
    this.addMethod('stroke', []);
    this.addMethod('restore', []);
    return this;
  };

  this.draw = ctx => {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'dodgerblue';
    ctx.lineWidth = 2;

    this.commands.forEach(command => {
      if (command.type === 'method') {
        ctx[command.name](...command.args);
      } else if (command.type === 'assert') {
        ctx[command.name] = command.value;
      }
    });
  };
};
