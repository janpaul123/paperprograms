/* global module, __dirname */
module.exports = {
  entry: {
    camera: './src/entry-camera.js',
    projector: './src/entry-projector.js',
  },
  output: {
    path: __dirname,
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
};
