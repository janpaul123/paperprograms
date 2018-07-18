import React from 'react';

import { add } from '../utils';
import styles from './DebugProgram.css';

export default class CameraMain extends React.Component {
  constructor(props) {
    super(props);

    const videoRatio = this.props.videoWidth / this.props.videoHeight;
    const bl = props.program.points[3];
    const br = props.program.points[2];
    bl.y *= videoRatio;
    br.y *= videoRatio;

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

  _onMouseLeave = () => {
    if (this.state.grabbed) return;
    if (this.state.resizing) return;

    this.props.onRelease();
  };

  _onMouseDown = event => {
    if (event.target === this._closeEl) {
      this.props.remove();
      return;
    }
    const rect = this._el.getBoundingClientRect();
    const x = event.clientX - rect.x;
    const y = event.clientY - rect.y;

    const resizing = event.target === this._handleEl;
    const grabbed = !resizing;

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
        onMouseLeave={this._onMouseLeave}
        onDrag={this._onDrag}
        className={styles.program}
        style={{
          position: 'absolute',
          left: `${tl.x * 100}%`,
          top: `${tl.y * 100}%`,
          width: `${width * 100}%`,
          height: `${height * 100}%`,
        }}
      >
        <h3>Program #{this.state.program.number}</h3>

        <div ref={el => (this._handleEl = el)} className={styles.resizeHandle} />

        <div ref={el => (this._closeEl = el)} className={styles.closeButton} />
      </div>
    );
  }
}
