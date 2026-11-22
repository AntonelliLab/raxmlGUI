const babelJest = require( 'babel-jest' );

// Define-semantics class fields and the automatic JSX runtime, as the page build emits. preset-env and preset-typescript
// are what Jest needs to load the page's ESM and .tsx imports.
module.exports = babelJest.default.createTransformer( {
  babelrc: false,
  configFile: false,
  presets: [
    [ '@babel/preset-env', { targets: { node: 'current' } } ],
    '@babel/preset-typescript',
  ],
  plugins: [
    [ '@babel/plugin-proposal-class-properties', { loose: false } ],
    [ '@babel/plugin-transform-react-jsx', { runtime: 'automatic' } ],
  ],
} );
