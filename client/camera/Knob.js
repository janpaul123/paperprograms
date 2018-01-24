import React from 'react';
import styles from './Knob.css';

export default class Knob extends React.Component {
    _onMouseDown = () => {
      const mouseMoveHandler = event => {
        const parentOffset = this._el.offsetParent.getBoundingClientRect();
        this.props.onChange({
          x: event.clientX - parentOffset.left,
          y: event.clientY - parentOffset.top,
        });
      };
      const mouseUpHandler = () => {
        document.body.removeEventListener('mousemove', mouseMoveHandler, true);
        document.body.removeEventListener('mouseup', mouseUpHandler, true);
      };
      document.body.addEventListener('mousemove', mouseMoveHandler, true);
      document.body.addEventListener('mouseup', mouseUpHandler, true);
    };
  
    render() {
      return (
        <div
          className={styles.knob}
          style={{ left: this.props.x, top: this.props.y }}
          onMouseDown={this._onMouseDown}
          ref={el => (this._el = el)}
        />
      );
    }
  }
  