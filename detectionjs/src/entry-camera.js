import React from 'react';
import ReactDOM from 'react-dom';

import CameraMain from './CameraMain';

const defaultConfig = {
  colorsRGB: [
    [119, 43, 24, 255],
    [155, 108, 35, 255],
    [94, 104, 48, 255],
    [65, 80, 84, 255],
    [92, 36, 42, 255],
  ],
  cameraOutputWidth: 800,
  knobPoints: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }],
};

localStorage.dynazarConfig = JSON.stringify({
  ...defaultConfig,
  ...JSON.parse(localStorage.dynazarConfig || '{}'),
});

const element = document.createElement('div');
document.body.appendChild(element);

function render() {
  ReactDOM.render(
    <CameraMain
      config={JSON.parse(localStorage.dynazarConfig)}
      onConfigChange={config => {
        localStorage.dynazarConfig = JSON.stringify(config);
        render();
      }}
      onProgramsChange={programs => {
        localStorage.dynazarProgramsToRender = JSON.stringify(programs);
      }}
    />,
    element
  );
}
render();

window.getDynazarConfig = () => JSON.parse(localStorage.dynazarConfig);
window.setDynazarConfig = config => (localStorage.dynazarConfig = JSON.stringify(config));
