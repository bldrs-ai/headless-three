module.exports = {
  verbose: false,
  testEnvironment: 'node',
  testPathIgnorePatterns: [],
  transform: {'\\.[jt]sx?$': 'babel-jest'},
  transformIgnorePatterns: [],
  moduleNameMapper: {},
  setupFilesAfterEnv: ['./src/setupTests.js'],
}
