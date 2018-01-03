import React from 'react';
import ReactDOM from 'react-dom';

import EditorMain from './EditorMain';

const element = document.createElement('div');

document.body.appendChild(element);

ReactDOM.render(<EditorMain spaceName={window.location.search.slice(1)} />, element);
