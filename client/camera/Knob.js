import React from 'react';
import styles from './Knob.css';
import * as d3 from 'd3';

export default class Knob extends React.Component {
  componentDidMount() {
    this._attachDragger();
  }
  _attachDragger = () => {
    const dragger = d3
      .drag()
      .subject(() => {
        // drag origin
        const { x, y } = this.props;
        return { x, y };
      })
      .on('drag', () => {
        const { x, y } = d3.event;
        this.props.onChange({ x, y });
      });
    d3.select(this._el).call(dragger);
  };
  render() {
    const { x, y } = this.props;
    return (
      <div
        className={styles.knob}
        style={{
          transform: `translate(${x}px,${y}px)`,
        }}
        ref={el => (this._el = el)}
      >
        {this.props.label}
      </div>
    );
  }
}
