module.exports = {
  root: true,
  extends: ['react-app', 'react-app/jest'],
  ignorePatterns: ['build/', 'dist/', 'docs/', 'node_modules/'],
  plugins: ['lodash'],
  rules: {
    'lodash/import-scope': 2,
    'comma-dangle': ['error', 'always-multiline'],
    'prefer-destructuring': [
      'error',
      {
        object: true,
        array: false,
      },
    ],
    indent: ['error', 2, { SwitchCase: 1 }],
    'multiline-ternary': ['error', 'always'],
    'space-in-parens': ['error', 'always'],
    'no-warning-comments': [
      'error',
      {
        terms: [ 'shortcut:' ],
        location: 'anywhere',
      },
    ],
    'no-restricted-syntax': [
      'error',
      'WithStatement',
      {
        selector: "CallExpression[callee.property.name='subscribe'][arguments.0.type='Literal']",
        message: 'Pass a runEvents value.',
      },
      {
        selector: "BinaryExpression[operator=/^(>|<|>=|<=)$/] > UnaryExpression[operator='!'][argument.property.name='length']",
        message: 'Negate the comparison, not length. Prefer while (list.length > 0).',
      },
    ],
  },
  overrides: [
    {
      files: [ 'src/app/store/**/*.{js,jsx,ts,tsx}' ],
      rules: {
        'no-restricted-syntax': [
          'error',
          'WithStatement',
          {
            selector: "CallExpression[callee.property.name='subscribe'][arguments.0.type='Literal']",
            message: 'Pass a runEvents value.',
          },
          {
            selector: "BinaryExpression[operator=/^(>|<|>=|<=)$/] > UnaryExpression[operator='!'][argument.property.name='length']",
            message: 'Negate the comparison, not length. Prefer while (list.length > 0).',
          },
          {
            selector: "CallExpression[callee.object.name='rendererBridge'][callee.property.name=/^on[A-Z]/]",
            message: 'Subscribe through runEvents and StoreBase.subscribe.',
          },
        ],
      },
    },
    {
      // `yarn lint` does not include e2e, and that tree does not use the src parenthesis style.
      files: ['e2e/**/*.js'],
      rules: {
        'space-in-parens': 'off',
      },
    },
    {
      files: ['**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/consistent-type-imports': [
          'error',
          {
            fixStyle: 'separate-type-imports',
            prefer: 'type-imports',
          },
        ],
        '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
        '@typescript-eslint/array-type': [
          'error',
          {
            default: 'array',
          },
        ],
        'import/consistent-type-specifier-style': [
          'error',
          'prefer-top-level',
        ],
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            vars: 'all',
            args: 'after-used',
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            ignoreRestSiblings: true,
            caughtErrors: 'all',
            caughtErrorsIgnorePattern: '^_',
          },
        ],
      },
    },
  ],
};
