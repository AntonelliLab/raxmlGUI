module.exports = {
  babel: {
      plugins: [
          ["@babel/plugin-proposal-decorators", { legacy: true }]
      ]
  },
  webpack: {
    configure: {
        target: 'electron-renderer'
    }
  }
};
