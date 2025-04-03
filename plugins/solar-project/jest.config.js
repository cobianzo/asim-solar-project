/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'jsdom',
	roots: ['<rootDir>/src', '<rootDir>/src/unit-tests'],
	testMatch: ['**/src/unit-tests/**/*.test.ts'],
	setupFiles: ['<rootDir>/src/unit-tests/mocks/googleMapsMock.ts'],
};
