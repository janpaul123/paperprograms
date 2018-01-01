const express = require('express');
const morgan = require('morgan');
const path = require('path');
const sslRedirect = require('heroku-ssl-redirect');

const app = express();
app.use(morgan('short'));
app.use(sslRedirect(['production']));
app.use(express.static(path.join(__dirname, '..', 'www')));

if (process.env.NODE_ENV !== 'production') {
  const compiler = require('webpack')(require('../webpack.config.js'));
  app.use(require('webpack-dev-middleware')(compiler));
  app.use(require('webpack-hot-middleware')(compiler));
}

/* eslint-disable no-console */
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}!`));
