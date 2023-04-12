/**
 * React component that shows a colored circle or marker representing one of the colors
 * that can be detected by the camera.
 *
 * Currently used to display markers and calibration icons.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import React from 'react';
import clientConstants from '../clientConstants.js';
import { colorDataToCSS } from '../utils.js';
import styles from './CameraMain.css';

export default class ColorListItem extends React.Component {
  constructor( props ) {
    super( props );
  }

  render() {
    const colorIndex = this.props.colorIndex;
    const color = this.props.color;

    // optional larger size, otherwise falls back to styles sheet
    const size = this.props.size || null;
    return (
      <div
        className={styles.colorListItem}
        style={{
          background: colorDataToCSS( color ),
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: `${size}px`,
          lineHeight: `${size}px`
        }}
        onClick={() => this.props.onClick( colorIndex )}
      ><b>{clientConstants.colorNames[ colorIndex ]}</b>
      </div>
    );
  }
}