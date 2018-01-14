import React from 'react';
import ReactDOM from 'react-dom';
import uuidv4 from 'uuid/v4';

import EditorMain from './EditorMain';

const element = document.createElement('div');
document.body.appendChild(element);

const defaultConfig = {
  editorId: uuidv4(),
};

localStorage.paperProgramsEditorConfig = JSON.stringify({
  ...defaultConfig,
  ...JSON.parse(localStorage.paperProgramsEditorConfig || '{}'),
});

ReactDOM.render(
  <EditorMain
    editorConfig={JSON.parse(localStorage.paperProgramsEditorConfig)}
    spaceName={window.location.search.slice(1)}
  />,
  element
);
