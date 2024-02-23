module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
  },
  extends: 'airbnb-base',
  overrides: [
    {
      env: {
        node: true,
      },
      files: [
        '.eslintrc.{js,cjs}',
      ],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  ignorePatterns: ['util/string.js'],
  rules: {
    'max-classes-per-file': ['error', 5],
    'linebreak-style': 'off',
    'import/extensions': 'off',
    'no-use-before-define': ['error', { functions: false }],
    'no-await-in-loop': 'warn',
    'no-restricted-syntax': 'off',
    'no-continue': 'off',
  },
};
