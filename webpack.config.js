const path = require('path');

module.exports = {
  entry: {
    camera: ['./client/camera/entry.js'],
    projector: ['./client/projector/entry.js'],
    editor: ['./client/editor/entry.js'],
    paper: ['./client/paper/entry.js'],
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
