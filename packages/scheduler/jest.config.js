/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testRegex: '.*\\.test\\.ts$',
  moduleNameMapper: {
    '^@gtm/common$': '<rootDir>/../common/dist/index.js',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/__tests__/**'],
  coverageDirectory: '<rootDir>/coverage',
};
