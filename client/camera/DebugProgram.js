import React from 'react';

import { add } from '../utils';

export default class CameraMain extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      program: props.program,
      grabbed: false,
      grabbedOffset: { x: 0, y: 0 },
      resizing: false,
    };
  }

  _onMouseEnter = () => {
    this.props.onMouseEnter();
  };

  _onMouseOut = event => {
    if (event.relatedTarget === this._el) return;
    if (event.relatedTarget === this._handleEl) return;
    if (this.state.grabbed) return;
    if (this.state.resizing) return;

    this.props.onRelease();
  };

  _onMouseDown = event => {
    const rect = this._el.getBoundingClientRect();
    const x = event.clientX - rect.x;
    const y = event.clientY - rect.y;

    const grabbed = event.target === this._el;
    const resizing = event.target === this._handleEl;

    this.setState({ grabbed, resizing, grabbedOffset: { x, y } });
    document.addEventListener('mouseup', this._onMouseUp, false);
    document.addEventListener('mousemove', this._onMouseMove, false);
  };

  _onMouseUp = () => {
    this.setState({ grabbed: false, resizing: false });
    document.removeEventListener('mouseup', this._onMouseUp, false);
    document.removeEventListener('mousemove', this._onMouseMove, false);
  };

  _onMouseMove = event => {
    const rect = this._el.getBoundingClientRect();
    const parentRect = this._el.parentElement.getBoundingClientRect();

    const program = this.state.program;
    if (this.state.grabbed) {
      const x = event.clientX - rect.x - this.state.grabbedOffset.x;
      const y = event.clientY - rect.y - this.state.grabbedOffset.y;

      const normx = x / parentRect.width;
      const normy = y / parentRect.height;
      program.points = program.points.map(point => add(point, { x: normx, y: normy }));
    }

    if (this.state.resizing) {
      const tr = program.points[1];
      const br = program.points[2];
      const bl = program.points[3];

      const x = event.clientX - parentRect.x;
      const y = event.clientY - parentRect.y;

      const normx = x / parentRect.width;
      const normy = y / parentRect.height;
      tr.x = normx;
      br.x = normx;
      br.y = normy;
      bl.y = normy;
    }

    this.setState({ program });
  };

  render() {
    const tl = this.state.program.points[0];
    const br = this.state.program.points[2];
    const width = br.x - tl.x;
    const height = br.y - tl.y;

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
          width: `${width * 100}%`,
          height: `${height * 100}%`,
          background: 'white',
          color: 'black',
          opacity: 0.7,
        }}
      >
        <h3>Program {this.state.program.number}</h3>

        <div
          ref={el => (this._handleEl = el)}
          style={{
            position: 'absolute',
            right: '0px',
            bottom: '0px',
            width: '20px',
            height: '20px',
            background: 'black',
          }}
        />
      </div>
    );
  }
}
