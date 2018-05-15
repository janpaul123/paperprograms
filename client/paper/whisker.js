import EventEmitter from 'events';

export default class WhiskerFactory {
  constructor(workerContext) {
    this.whiskers = [];
    this.workerContext = workerContext;
    this.update = this.update.bind(this);
  }

  async createWhisker(options) {
    const whisker = new Whisker({
      ...options,
      paperNumber: options.paperNumber || (await this.workerContext.paper.get('number')),
      workerContext: this.workerContext,
      whiskerFactory: this,
    });

    if (this.whiskers.length === 0) {
      setInterval(this.update, 10);
    }

    if (!this.canvas) {
      this.canvas = await this.workerContext.paper.get('supporterCanvas', { id: 'whisker' });
      this.ctx = this.canvas.getContext('2d');
    }

    this.whiskers.push(whisker);

    return whisker;
  }

  async destroyWhisker(whisker) {
    this.whiskers = this.whiskers.filter(other => other !== whisker);

    if (this.whiskers.length === 0) {
      clearInterval(this.update);
    }
  }

  async update() {
    const papers = await this.workerContext.paper.get('papers');

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.whiskers.forEach(whisker => whisker.update(papers, this.ctx));
    this.ctx.commit();
  }
}

class Whisker extends EventEmitter {
  constructor({
    whiskerFactory,
    paperNumber,
    direction = 'up',
    whiskerLength = 0.7,
    requiredData = [],
    color = 'rgb(255, 0, 0)',
  }) {
    super();

    this.paperNumber = paperNumber;
    this.direction = direction;
    this.whiskerLength = whiskerLength;
    this.requiredData = requiredData;
    this.color = color;

    this._pointAtData = null;
    this._lastWhiskerEnd = null;
    this._whiskerFactory = whiskerFactory;
  }

  update(papers, ctx) {
    const points = papers[this.paperNumber].points;

    let segment = [points.topLeft, points.topRight];
    if (this.direction === 'right') segment = [points.topRight, points.bottomRight];
    if (this.direction === 'down') segment = [points.bottomRight, points.bottomLeft];
    if (this.direction === 'left') segment = [points.bottomLeft, points.topLeft];

    const whiskerStart = {
      x: (segment[0].x + segment[1].x) / 2,
      y: (segment[0].y + segment[1].y) / 2,
    };
    const whiskerEnd = {
      x: whiskerStart.x + (segment[1].y - segment[0].y) * this.whiskerLength,
      y: whiskerStart.y - (segment[1].x - segment[0].x) * this.whiskerLength,
    };

    if (
      !this._pointAtData ||
      !papers[this._pointAtData.paperNumber] ||
      // Try keeping `pointAtData` stable if possible.
      !this._intersectsPaper(whiskerStart, whiskerEnd, papers[this._pointAtData.paperNumber])
    ) {
      let newPointAtData = null;
      Object.keys(papers).forEach(otherPaperNumber => {
        if (otherPaperNumber === this.paperNumber) return;
        if (this._intersectsPaper(whiskerStart, whiskerEnd, papers[otherPaperNumber])) {
          newPointAtData = { paperNumber: otherPaperNumber, paper: papers[otherPaperNumber] };
        }
      });

      if (this._pointAtData) {
        this.emit('paperRemoved', this._pointAtData);
      }

      if (newPointAtData) {
        this.emit('paperAdded', newPointAtData);
      }

      this._pointAtData = newPointAtData;
    }

    // render whisker with dot animation
    ctx.clearRect(0, 0, ctx.width, ctx.height);
    ctx.fillStyle = ctx.strokeStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(whiskerStart.x, whiskerStart.y);
    ctx.lineTo(whiskerEnd.x, whiskerEnd.y);
    ctx.stroke();

    const dotFraction = Math.abs(Math.sin((Date.now() / 600)));

    // only show dot when whisker is connected to other paper
    if (this._pointAtData) {
      ctx.beginPath();
      ctx.arc(
        whiskerEnd.x * dotFraction + whiskerStart.x * (1 - dotFraction),
        whiskerEnd.y * dotFraction + whiskerStart.y * (1 - dotFraction),
        2,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }

    if (
      !this._lastWhiskerEnd ||
      this._lastWhiskerEnd.x !== whiskerEnd.x ||
      this._lastWhiskerEnd.y !== whiskerEnd.y
    ) {
      this._lastWhiskerEnd = whiskerEnd;
      this.emit('whiskerMoved', { x: Math.round(whiskerEnd.x), y: Math.round(whiskerEnd.y) });
    }
  }

  _intersectsPaper(whiskerStart, whiskerEnd, paper) {
    return (
      (intersects(whiskerStart, whiskerEnd, paper.points.topLeft, paper.points.topRight) ||
        intersects(whiskerStart, whiskerEnd, paper.points.topRight, paper.points.bottomRight) ||
        intersects(whiskerStart, whiskerEnd, paper.points.bottomRight, paper.points.bottomLeft) ||
        intersects(whiskerStart, whiskerEnd, paper.points.bottomLeft, paper.points.topLeft)) &&
      this.requiredData.every(name => paper.data[name] !== undefined)
    );
  }

  destroy() {
    this._whiskerFactory.destroyWhisker(this);
  }
}

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
