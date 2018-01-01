const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    camera: ['./client/entry-camera.js'],
    projector: ['./client/entry-projector.js'],
  },
  output: {
    path: path.join(__dirname, 'www'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        loader: 'babel-loader',
        query: {
          cacheDirectory: '.babel-cache',
          sourceMap: false,
        },
      },
    ],
  },
  plugins: [],
};

if (process.env.NODE_ENV !== 'production') {
  module.exports.plugins.push(new webpack.HotModuleReplacementPlugin());
  Object.values(module.exports.entry).forEach(entry => {
    entry.unshift('webpack-hot-middleware/client?reload=true');
  });
}
