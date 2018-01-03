const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    camera: ['./client/entry-camera.js'],
    projector: ['./client/entry-projector.js'],
    editor: ['./client/entry-editor.js'],
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
      {
        test: /\.css$/,
        exclude: [/node_modules/],
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              localIdentName: '[path][name]--[local]--[hash:base64:10]',
            },
          },
        ],
      },
      // Per https://github.com/devongovett/pdfkit/issues/659#issuecomment-321452649
      {
        test: /node_modules\/(pdfkit|fontkit|png-js|linebreak|unicode-properties|brotli)\//,
        loader: 'transform-loader?brfs',
      },
      {
        test: /node_modules\/unicode-properties.*\.json$/,
        use: 'json-loader',
      },
    ],
  },
  plugins: [
    new require('copy-webpack-plugin')([
      {
        from: 'node_modules/monaco-editor/min/vs',
        to: 'vs',
      },
    ]),
  ],
};

if (process.env.NODE_ENV !== 'production') {
  module.exports.plugins.push(new webpack.HotModuleReplacementPlugin());
  Object.values(module.exports.entry).forEach(entry => {
    entry.unshift('webpack-hot-middleware/client?reload=true');
  });
}
