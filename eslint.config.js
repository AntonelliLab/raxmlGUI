import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig } from 'eslint/config';
import { importX, createNodeResolver } from 'eslint-plugin-import-x';
import lodash from 'eslint-plugin-lodash';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  // The lint fixtures are known-bad on purpose; src/lint.test.ts lints them with `ignore: false`.
  { ignores: [ 'build/', 'dist/', 'out/', 'docs/', 'node_modules/', 'src/test/lintFixtures/' ] },

  js.configs.recommended,
  tseslint.configs.recommended,
  tseslint.configs.stylistic,

  // Per-process globals. typescript-eslint turns `no-undef` off for TypeScript, so today these
  // only bind for the two JavaScript config files; the blocks keep the process boundaries explicit.
  { files: [ 'src/main/**' ], languageOptions: { globals: globals.node } },
  { files: [ 'src/preload/**', 'src/preload-proofs/**' ], languageOptions: { globals: { ...globals.node, ...globals.browser } } },
  { files: [ 'src/app/**', 'src/index.tsx', 'src/registerServiceWorker.ts' ], languageOptions: { globals: globals.browser } },
  { files: [ 'src/**/*.test.{ts,tsx}', 'src/test/**' ], languageOptions: { globals: { ...globals.node, ...globals.browser } } },
  { files: [ 'electron.vite.config.js', 'vitest.config.mjs', 'eslint.config.js' ], languageOptions: { globals: globals.node } },

  // The repo's own style, on every linted file.
  {
    plugins: { '@stylistic': stylistic, 'import-x': importX, lodash },
    settings: {
      // Without the TypeScript extensions `import-x/no-cycle` resolves nothing and passes silently.
      ...importX.flatConfigs.typescript.settings,
      'import-x/resolver-next': [ createNodeResolver( { extensions: [ '.ts', '.tsx', '.js', '.mjs', '.json' ] } ) ],
    },
    rules: {
      'lodash/import-scope': 'error',
      'import-x/no-cycle': 'error',
      'import-x/first': 'error',
      'prefer-destructuring': [ 'error', { object: true, array: false } ],
      'no-warning-comments': [ 'error', { terms: [ 'shortcut:' ], location: 'anywhere' } ],
      eqeqeq: [ 'error', 'smart' ],
      'array-callback-return': 'error',
      'no-throw-literal': 'error',
      'no-self-compare': 'error',
      'no-template-curly-in-string': 'error',
      'no-useless-rename': 'error',
      'no-useless-computed-key': 'error',
      'no-useless-concat': 'error',
      '@stylistic/indent': [ 'error', 2, { SwitchCase: 1 } ],
      '@stylistic/comma-dangle': [ 'error', 'always-multiline' ],
      '@stylistic/space-in-parens': [ 'error', 'always' ],
      '@stylistic/multiline-ternary': [ 'error', 'always' ],
      '@stylistic/semi': [ 'error', 'always' ],
      '@stylistic/quotes': [ 'error', 'single', { avoidEscape: true } ],
    },
  },

  // Page: the hooks rules, including the React Compiler ones.
  { files: [ 'src/**/*.{ts,tsx}' ], ...reactHooks.configs.flat.recommended },

  {
    files: [ 'src/**/*.{ts,tsx}' ],
    rules: {
      // typescript-eslint turns this off for TypeScript.
      'no-unreachable': 'error',
      '@typescript-eslint/consistent-type-imports': [ 'error', { fixStyle: 'separate-type-imports', prefer: 'type-imports' } ],
      'import-x/consistent-type-specifier-style': [ 'error', 'prefer-top-level' ],
      '@typescript-eslint/no-useless-constructor': 'error',
      '@typescript-eslint/no-unused-vars': [ 'error', {
        vars: 'all',
        args: 'after-used',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
      } ],
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/class-literal-property-style': 'off',
    },
  },
);
