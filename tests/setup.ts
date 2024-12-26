import { jest } from '@jest/globals';

// Extend timeout for browser tests
jest.setTimeout(30000);

// Mock console methods to reduce noise
global.console = {
    ...console,
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};