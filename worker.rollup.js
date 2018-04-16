import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  input: 'client/paper/entry.worker.js',
  output: {
    file: 'www/paper.js',
    format: 'iife', // `importScripts` expects an iife
  },
  plugins: [
    nodeResolve(), // look for packages in node_modules
    commonjs(), // convert packages from commonjs if any
  ],
};
