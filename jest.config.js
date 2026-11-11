const createJestConfig = require('next/jest')({ dir: './' });

module.exports = createJestConfig({
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testMatch: ['<rootDir>/tests/**/*.test.[jt]s?(x)'],
});
