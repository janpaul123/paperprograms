const express = require('express');
const path = require('path');
const morgan = require('morgan');

const app = express();
app.use(morgan('short'));
app.use(express.static(path.join(__dirname, '..', 'www')));

if (process.env.NODE_ENV !== 'production') {
  const compiler = require('webpack')(require('../webpack.config.js'));
  app.use(require('webpack-dev-middleware')(compiler));
  app.use(require('webpack-hot-middleware')(compiler));
}

/* eslint-disable no-console */
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}!`));
