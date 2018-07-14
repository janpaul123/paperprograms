import React from 'react';
import ReactDOM from 'react-dom';

import ProjectorMain from './ProjectorMain';
import { paperSizes } from '../constants';

const element = document.createElement('div');
document.body.appendChild(element);
function render(callback) {
  const paperProgramsConfig = JSON.parse(localStorage.paperProgramsConfig);
  const paperSizeName = paperProgramsConfig.paperSize;
  const paperSize = paperSizeName in paperSizes ? paperSizes[paperSizeName] : paperSizes.LETTER;
  const paperRatio = paperSize[1] / paperSize[0];

  ReactDOM.render(
    <ProjectorMain
      knobPoints={paperProgramsConfig.knobPoints}
      paperRatio={paperRatio}
      programsToRender={JSON.parse(localStorage.paperProgramsProgramsToRender || '[]')}
      markers={JSON.parse(localStorage.paperProgramsMarkers || '[]')}
      dataByProgramNumber={JSON.parse(localStorage.paperProgramsDataByProgramNumber || '{}')}
      onDataByProgramNumberChange={(dataByProgramNumber, otherCallback) => {
        localStorage.paperProgramsDataByProgramNumber = JSON.stringify(dataByProgramNumber);
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
