/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
    'vitest-globals/env': true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:vue/vue3-recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier',
    'plugin:vitest/recommended',
    'plugin:vitest-globals/recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['prettier', 'vitest'],
  ignorePatterns: ['vite-env.d.ts'],
  rules: {
    'vue/multi-word-component-names': [
      'error',
      {
        ignores: ['Layout', 'Home'],
      },
    ],
    '@typescript-eslint/no-explicit-any': ['off'],
  },
  globals: {},
};
