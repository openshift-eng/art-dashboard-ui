module.exports = {
    testEnvironment: 'jsdom',
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: [
        'static/js/**/*.js',
        '!static/js/**/*.min.js',
    ],
    coverageDirectory: 'coverage',
    verbose: true,
};
