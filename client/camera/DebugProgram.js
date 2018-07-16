import React from 'react';

import { add, diff } from '../utils';

export default class CameraMain extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      program: props.program,
      grabbed: false,
      grabbedOffset: { x: 0, y: 0 },
    };
  }

  _onMouseEnter = () => {
    this.props.onMouseEnter();
  };

  _onMouseOut = () => {
    if (!this.state.grabbed) {
      this.props.onRelease();
    }
  };

  _onMouseDown = event => {
    const rect = this._el.getBoundingClientRect();
    const x = event.clientX - rect.x;
    const y = event.clientY - rect.y;

    this.setState({ grabbed: true, grabbedOffset: { x, y } });
    document.addEventListener('mouseup', this._onMouseUp, false);
    document.addEventListener('mousemove', this._onMouseMove, false);
  };

  _onMouseUp = () => {
    this.setState({ grabbed: false });
    document.removeEventListener('mouseup', this._onMouseUp, false);
    document.removeEventListener('mousemove', this._onMouseMove, false);
  };

  _onMouseMove = event => {
    const rect = this._el.getBoundingClientRect();
    const x = event.clientX - rect.x - this.state.grabbedOffset.x;
    const y = event.clientY - rect.y - this.state.grabbedOffset.y;

    const parentRect = this._el.parentElement.getBoundingClientRect();
    const normx = x / parentRect.width;
    const normy = y / parentRect.height;

    const program = this.state.program;
    program.points = program.points.map(point => add(point, { x: normx, y: normy }));
    this.setState({ program });
  };

  render() {
    const tl = this.state.program.points[0];
    const br = this.state.program.points[2];

    return (
      <div
        ref={el => (this._el = el)}
        onMouseDown={this._onMouseDown}
        onMouseEnter={this._onMouseEnter}
        onMouseOut={this._onMouseOut}
        onDrag={this._onDrag}
        style={{
          userSelect: 'none',
          position: 'absolute',
          left: `${tl.x * 100}%`,
          top: `${tl.y * 100}%`,
          width: `${(br.x - tl.x) * 100}%`,
          height: `${(br.y - tl.y) * 100}%`,
          background: 'white',
          color: 'black',
        }}
      >
        <h2>Program {this.state.program.number}</h2>
      </div>
    );
  }
}
