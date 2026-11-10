const babelJest = require( 'babel-jest' );

// Decorator plugins match the page build. preset-env and preset-typescript
// are what Jest needs to load the page's ESM and .tsx imports.
module.exports = babelJest.default.createTransformer( {
  babelrc: false,
  configFile: false,
  presets: [
    [ '@babel/preset-env', { targets: { node: 'current' } } ],
    '@babel/preset-typescript',
  ],
  plugins: [
    [ '@babel/plugin-proposal-decorators', { legacy: true } ],
    [ '@babel/plugin-proposal-class-properties', { loose: true } ],
    [ '@babel/plugin-transform-react-jsx', { runtime: 'automatic' } ],
  ],
} );
