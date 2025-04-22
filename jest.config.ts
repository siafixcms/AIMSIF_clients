import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
};

export default config;

