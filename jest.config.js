module.exports = {
  collectCoverage: false,
  collectCoverageFrom: ['src/lib/**/*.js'],
  coveragePathIgnorePatterns: ['/node_modules/', '/test/'],
  coverageThreshold: {global: {branches: 90, functions: 90, lines: 90, statements: 90}},
  moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx'],
  rootDir: '.',
  moduleDirectories: ['<rootDir>/node_modules'],
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/'],
  testRegex: '/test/.+.test.[jt]s',
  setupFiles: ['dotenv/config'],
}
