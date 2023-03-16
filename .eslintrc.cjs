// Copyright 2022, University of Colorado Boulder

module.exports = {
  env: {
    browser: true,
    node: true
  },
  extends: [
    'plugin:react/recommended',
    '../chipper/eslint/sim_eslintrc.js',
    '../chipper/eslint/node_eslintrc.js',
    '../chipper/eslint/format_eslintrc.js'
  ],
  ignorePatterns: [
    'static/*'
  ],
  parser: '@babel/eslint-parser',
  parserOptions: {
    babelOptions: {
      presets: [
        '@babel/preset-react'
      ]
    },
    requireConfigFile: false
  },
  rules: {

    'jsx-quotes': [
      'error',
      'prefer-single'
    ],
    'require-statement-match': 'off',
    'require-atomic-updates': [
      'error',
      { allowProperties: true }
    ],
    'default-import-match-filename': 'off',
    'react/no-unescaped-entities': 'off',
    'react/prop-types': 'off',

    // Disable many of the PhET rules that are difficult to apply to this project due to all the legacy code.
    'bad-sim-text': 'off',
    'bad-text': 'off',
    'todo-should-have-issue': 'off',
    'copyright': 'off',
    'visibility-annotation': 'off',
    'no-eval': 'off',
    'phet-object-shorthand': 'off',
    'default-export-class-should-register-namespace': 'off',
    'single-line-import': 'off'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};