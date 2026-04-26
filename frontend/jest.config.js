module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { configFile: './babel.config.js' }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(pako)/)',
  ],
  setupFiles: ['./jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  moduleNameMapper: {
    '^expo-secure-store$':                    '<rootDir>/modules/__mocks__/expo-secure-store.js',
    '^expo-crypto$':                          '<rootDir>/modules/__mocks__/expo-crypto.js',
    '^@react-native-community/netinfo$':      '<rootDir>/modules/__mocks__/netinfo.js',
  },
};
