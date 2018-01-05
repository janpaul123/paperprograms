import React from 'react';
import ReactDOM from 'react-dom';

import ProjectorMain from './ProjectorMain';

const element = document.createElement('div');
document.body.appendChild(element);
function render(callback) {
  ReactDOM.render(
    <ProjectorMain
      programsToRender={JSON.parse(localStorage.dynazarProgramsToRender || '[]')}
      dataByProgramNumber={JSON.parse(localStorage.dynazarDataByProgramNumber || '{}')}
      onDataByProgramNumberChange={(dataByProgramNumber, otherCallback) => {
        localStorage.dynazarDataByProgramNumber = JSON.stringify(dataByProgramNumber);
        render(otherCallback);
      }}
    />,
    element,
    callback
  );
}
window.addEventListener('storage', () => render());
window.addEventListener('resize', () => render());
render();
