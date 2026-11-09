const path = require('path');

const SentryWebpackPlugin = require('@sentry/webpack-plugin');

const package = require('./package.json');

module.exports = {
  // other webpack configuration
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.join(__dirname, 'node_modules', 'electron-log'),
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { modules: false, targets: { node: '10.2.0' } }],
            ],
          },
        },
      },
    ],
  },
  plugins: [
    process.env.SENTRY_ORG && process.env.SENTRY_AUTH_TOKEN
      ? new SentryWebpackPlugin({
          // sentry-cli configuration - can also be done directly through sentry-cli
          // see https://docs.sentry.io/product/cli/configuration/ for details
          authToken: process.env.SENTRY_AUTH_TOKEN,
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          release: `${package.productName}@${package.version}`,

          // other SentryWebpackPlugin configuration
          include: '.',
          ignore: ['node_modules', 'webpack.config.js'],
        })
      : null,
  ].filter(Boolean),
};
