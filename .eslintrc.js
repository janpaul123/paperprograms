module.exports = {
  parser: 'babel-eslint',
  extends: ['eslint:recommended', 'prettier'],
  plugins: ['prettier', 'react'],
  rules: {
    'prettier/prettier': ['error', { singleQuote: true, trailingComma: 'es5', printWidth: 100 }],

    // Per https://stackoverflow.com/a/46809082
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',

    'no-shadow': 'error',
  },
  env: {
    browser: true,
    node: true,
  },
};
