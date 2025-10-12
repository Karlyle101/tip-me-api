import { config } from '../config';

// Set test environment variables
process.env.NODE_ENV = 'test';

// Extend Jest timeout for database operations
beforeAll(() => {
  jest.setTimeout(10000);
});

// Global test configuration
expect.extend({
  toBeValidDate(received) {
    const pass = !isNaN(Date.parse(received));
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid date`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidDate(): R;
    }
  }
}