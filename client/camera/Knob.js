import React from 'react';
import styles from './Knob.css';
import * as d3 from 'd3';

export default class Knob extends React.Component {
  componentDidMount() {
    this._attachDragger();
  }
  _attachDragger = () => {
    const dragger = d3.drag().on("drag", () => {
      const {x,y} = d3.event;
      this.props.onChange({x,y});
    });
    d3.select(this._el).call(dragger);
  }
  render() {
    const {x,y} = this.props;
    return (
      <div
        className={styles.knob}
        style={{
          position: 'absolute',
          transform: `translate(${x}px,${y}px)`
        }}
        onMouseDown={this._onMouseDown}
        ref={el => (this._el = el)}
      >
        {this.props.label}
      </div>
    );
  }
}
