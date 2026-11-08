module.exports = {
  root: true,
  extends: ['react-app', 'react-app/jest'],
  ignorePatterns: ['build/', 'dist/', 'docs/', 'node_modules/'],
  rules: {
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
  },
  overrides: [
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
      },
    },
  ],
};
