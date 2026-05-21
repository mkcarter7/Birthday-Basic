/**
 * Jest configuration for the Next.js frontend.
 *
 * testEnvironment: 'jsdom' simulates a browser DOM so React components and
 * browser globals like window/document are available in tests.
 *
 * moduleNameMapper: Next.js uses CSS modules and image imports that Jest
 * doesn't understand — these mappings replace them with empty stubs.
 *
 * transform: tells Jest to use the Next.js built-in Babel config for
 * transforming JSX/ESM code (instead of needing a separate babel.config.js).
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Points to your Next.js app root so next/jest can load next.config.js and .env.*
  dir: './',
});

/** @type {import('jest').Config} */
const customConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.js'],
  // Note: next/jest auto-detects jest.setup.js, but we list it explicitly here
  moduleNameMapper: {
    // Handle CSS imports (with CSS modules)
    '^.+\\.module\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    // Handle image imports
    '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  // Collect coverage from our source files (not node_modules)
  collectCoverageFrom: ['src/**/*.{js,jsx}', '!src/**/*.test.{js,jsx}'],
};

module.exports = createJestConfig(customConfig);
