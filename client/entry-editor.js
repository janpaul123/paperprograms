import React from 'react';
import ReactDOM from 'react-dom';
import uuidv4 from 'uuid/v4';

import EditorMain from './EditorMain';

const element = document.createElement('div');
document.body.appendChild(element);

const defaultConfig = {
  editorId: uuidv4(),
};

localStorage.dynazarEditorConfig = JSON.stringify({
  ...defaultConfig,
  ...JSON.parse(localStorage.dynazarEditorConfig || '{}'),
});

ReactDOM.render(
  <EditorMain
    editorConfig={JSON.parse(localStorage.dynazarEditorConfig)}
    spaceName={window.location.search.slice(1)}
  />,
  element
);
