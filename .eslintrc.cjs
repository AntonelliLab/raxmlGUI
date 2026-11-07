module.exports = {
  root: true,
  extends: ['react-app', 'react-app/jest'],
  ignorePatterns: ['build/', 'dist/', 'docs/', 'node_modules/'],
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
