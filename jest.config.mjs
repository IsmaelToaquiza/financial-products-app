import presets from 'jest-preset-angular/presets/index.js';

const { createCjsPreset } = presets;

export default {
  ...createCjsPreset(),

  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],

  testMatch: ['<rootDir>/src/**/*.spec.ts'],

  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.d.ts',
  ],

  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'html', 'lcov'],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};