/* global module, __dirname */
module.exports = {
  entry: './index.js',
  output: {
    path: __dirname,
    filename: 'bundle.js',
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
