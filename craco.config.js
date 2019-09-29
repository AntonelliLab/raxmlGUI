module.exports = {
  babel: {
      plugins: [
          ["@babel/plugin-proposal-decorators", { legacy: true }],
          ["@babel/plugin-proposal-class-properties", { loose: true }]
      ]
  },
  webpack: {
    configure: {
        target: 'electron-renderer'
    }
  }
};
