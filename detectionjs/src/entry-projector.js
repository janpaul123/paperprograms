import React from 'react';
import ReactDOM from 'react-dom';

import ProjectorMain from './ProjectorMain';

const element = document.createElement('div');
document.body.appendChild(element);
function render() {
  ReactDOM.render(
    <ProjectorMain programsToRender={JSON.parse(localStorage.dynazarProgramsToRender || '[]')} />,
    element
  );
}
window.addEventListener('storage', render);
window.addEventListener('resize', render);
render();
