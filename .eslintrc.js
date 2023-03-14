module.exports = {
  parser: 'babel-eslint',
  extends: ['eslint:recommended'],
  plugins: ['react'],
  rules: {

    // Per https://stackoverflow.com/a/46809082
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',

    'no-shadow': 'error',
  },
  env: {
    browser: true,
    node: true,
    es6: true
  },
  globals: {
    _: true,
    phet: true
  }
};
