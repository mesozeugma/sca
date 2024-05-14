/* eslint-disable */
export default {
  displayName: 'executor-lib',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: [
    'ts',
    'js',
    'html',
    'node', // tree-sitter
  ],
  coverageDirectory: '../../coverage/libs/executor-lib',
};
