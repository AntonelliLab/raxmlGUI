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
  },
  overrides: [
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
    {
      // Main TypeScript (#67): full typing under non-strict — typed catch, typed exports.
      files: ['src/main/**/*.{ts,tsx}', 'src/common/**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'error',
        'no-restricted-syntax': [
          'error',
          {
            selector: 'CatchClause[param][param.typeAnnotation=undefined]',
            message: 'Annotate catch bindings (use unknown).',
          },
          {
            selector:
              'CatchClause BinaryExpression[operator="instanceof"][right.name="Error"]',
            message:
              'Read (error as Error).message; jsdom Error is a different realm from Node throws.',
          },
        ],
      },
    },
  ],
};
