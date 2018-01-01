if (process.env.NODE_ENV === 'production') {
  require('./main');
} else {
  const nodemon = require('nodemon');
  const path = require('path');
  nodemon({ script: path.join(__dirname, 'main.js'), watch: __dirname });
}
