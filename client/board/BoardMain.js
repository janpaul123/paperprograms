/**
 * Main react component for the Board page.
 */

import React, { useState } from 'react';
import styles from './BoardMain.css';
import PaperLandConsole from './PaperLandConsole.js';
import PaperLandControls from './PaperLandControls.js';
import SceneryDisplay from './SceneryDisplay.js';

export default function BoardMain( props ) {

  const scene = props.scene;
  const boardConfigObject = props.boardConfigObject;
  const updatePositionInterval = props.updatePositionInterval;

  const [ consoleVisible, setConsoleVisible ] = useState( true );

  return (
    <div>
      <div className={styles.titleContainer}>
        <h1>Interactive Board</h1>
        <p>Add paper programs to Camera to add elements.</p>
      </div>
      <div className={styles.rowContainer}>
        <div className={styles.rowSpacer}>
        </div>
        <div className={styles.displayWithLog}>
          <SceneryDisplay scene={scene}/>
          <PaperLandConsole consoleVisible={consoleVisible}></PaperLandConsole>
        </div>
        <div className={styles.controls}>
          <div className={styles.paperLandControlsPanel}>
            <PaperLandControls
              initialPositionInterval={boardConfigObject.positionInterval}
              updatePositionInterval={updatePositionInterval}
              updateConsoleVisibility={setConsoleVisible}
            ></PaperLandControls>
          </div>
        </div>
      </div>
    </div>
  );
}