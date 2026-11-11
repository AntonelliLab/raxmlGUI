module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: [ '<rootDir>/jest/setup.js' ],
  roots: [ '<rootDir>/src' ],
  transform: {
    '^.+\\.(js|jsx|mjs|ts|tsx)$': '<rootDir>/jest/babelTransform.js',
  },
  transformIgnorePatterns: [ '/node_modules/(?!d3-array/)' ],
  moduleFileExtensions: [ 'js', 'jsx', 'mjs', 'ts', 'tsx', 'json', 'node' ],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/jest/fileMock.js',
    '^electron$': '<rootDir>/jest/electron.js',
    '^@sentry/electron/renderer$': '<rootDir>/jest/sentry.js',
  },
};
