module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@shared)/)',
  ],
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/../shared/$1',
    '^@/(.*)$': '<rootDir>/../client/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup/test-utils.tsx'],
  collectCoverageFrom: [
    'mobile/**/*.{ts,tsx}',
    '!mobile/**/*.test.{ts,tsx}',
    '!mobile/node_modules/**',
  ],
};

