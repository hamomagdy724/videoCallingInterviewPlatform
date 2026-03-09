# Testing Guide

This document provides comprehensive information about the test suite for the backend application.

## Overview

The backend test suite provides extensive coverage for all modified files in the current branch:
- `backend/src/lib/env.js` - Environment configuration module
- `backend/src/server.js` - Express server and API endpoints

## Test Statistics

- **Total Test Files**: 3
- **Total Test Lines**: ~983 lines
- **Test Categories**: Unit Tests, Integration Tests
- **Coverage Areas**: Environment Configuration, API Endpoints, HTTP Protocol, Edge Cases

## Installation

Before running tests, install the required dependencies:

```bash
cd backend
npm install
```

This will install:
- `jest@^29.7.0` - Testing framework
- `@jest/globals@^29.7.0` - Jest ES module support
- `supertest@^7.0.0` - HTTP assertion library
- Other development dependencies

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (auto-rerun on changes)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

## Test Files

### 1. Environment Configuration Tests
**File**: `backend/src/lib/__tests__/env.test.js`

Tests the ENV module that loads environment variables using dotenv.

**Test Coverage** (186 lines):
- ✅ Environment variable loading (PORT, DB_URL, NODE_ENV)
- ✅ Handling undefined/missing variables
- ✅ Empty string values
- ✅ Whitespace handling
- ✅ Different environment modes (development, test, production, staging)
- ✅ ENV object structure validation
- ✅ Special characters in connection strings
- ✅ Complex MongoDB URLs with authentication and replica sets
- ✅ Various NODE_ENV values

**Key Test Scenarios**:
```javascript
// Example: Testing environment variable loading
process.env.PORT = '3000';
process.env.DB_URL = 'mongodb://localhost:27017/testdb';
process.env.NODE_ENV = 'production';
const { ENV } = await import('../env.js');
expect(ENV.PORT).toBe('3000');
```

### 2. Server Unit Tests
**File**: `backend/src/__tests__/server.test.js`

Comprehensive unit tests for the Express server and API endpoints.

**Test Coverage** (461 lines):
- ✅ `/health` endpoint (status, response format, HTTP methods)
- ✅ `/books` endpoint (status, response format, HTTP methods)
- ✅ Production static file serving
- ✅ SPA catch-all route in production
- ✅ Non-existent routes (404 handling)
- ✅ HTTP methods support (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- ✅ Request headers handling (custom headers, Accept, User-Agent)
- ✅ Concurrent requests (load testing)
- ✅ Response format validation
- ✅ Environment-specific behavior
- ✅ Path resolution (`__dirname` and frontend paths)
- ✅ Edge cases (long queries, URL encoding, case sensitivity)

**Test Groups**:
1. Health Endpoint (9 tests)
2. Books Endpoint (7 tests)
3. Production Static File Serving (3 tests)
4. Non-existent Routes (4 tests)
5. HTTP Methods Support (3 tests)
6. Request Headers (3 tests)
7. Concurrent Requests (2 tests)
8. Response Format Validation (6 tests)
9. Environment-Specific Behavior (3 tests)
10. Path Resolution (3 tests)
11. Edge Cases (5 tests)

### 3. Server Integration Tests
**File**: `backend/src/__tests__/server.integration.test.js`

Integration tests that validate the complete API flow and cross-endpoint behavior.

**Test Coverage** (336 lines):
- ✅ Complete API flow with sequential requests
- ✅ Response consistency across multiple calls
- ✅ Interleaved requests to different endpoints
- ✅ Error handling and recovery
- ✅ Performance and load testing (50+ concurrent requests)
- ✅ Request and response integrity
- ✅ Stateless behavior validation
- ✅ HTTP protocol compliance
- ✅ Cross-endpoint consistency
- ✅ Route pattern matching
- ✅ Request validation and sanitization

**Test Groups**:
1. Complete API Flow (3 tests)
2. Error Handling and Recovery (3 tests)
3. Performance and Load Testing (2 tests)
4. Request and Response Integrity (3 tests)
5. Endpoint Interaction and State (2 tests)
6. HTTP Protocol Compliance (3 tests)
7. Cross-Endpoint Consistency (2 tests)
8. Route Pattern Matching (3 tests)
9. Request Validation and Sanitization (3 tests)

## Test Configuration

### Jest Configuration
**File**: `backend/jest.config.js`

Key settings:
- **testEnvironment**: 'node' - Node.js environment for backend tests
- **transform**: {} - No transformation (native ES modules)
- **testMatch**: Matches `*.test.js` files in `__tests__` directories
- **collectCoverageFrom**: Includes all `src/**/*.js` files except tests
- **testTimeout**: 10000ms - Allows time for async operations
- **clearMocks**: true - Automatic mock cleanup

### ES Module Support

The project uses native ES modules (`"type": "module"` in package.json). Jest is configured to run with:
```bash
NODE_OPTIONS=--experimental-vm-modules jest
```

## Test Patterns and Best Practices

### 1. Test Isolation
Each test is independent and doesn't rely on state from other tests:
```javascript
beforeEach(() => {
    app = express();
    // Fresh app instance for each test
});
```

### 2. Mocking External Dependencies
Environment variables and modules are mocked appropriately:
```javascript
jest.unstable_mockModule('../lib/env.js', () => ({
    ENV: mockEnv
}));
```

### 3. Async/Await Pattern
All HTTP requests use async/await for clean, readable code:
```javascript
it('should respond with 200', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
});
```

### 4. Comprehensive Assertions
Tests validate multiple aspects of responses:
```javascript
expect(response.statusCode).toBe(200);
expect(response.body).toEqual({ msg: "api is up and running" });
expect(response.headers['content-type']).toMatch(/json/);
```

### 5. Edge Case Testing
Tests cover boundary conditions and unexpected inputs:
- Empty strings
- Whitespace
- Special characters
- Long query strings
- Case sensitivity
- Concurrent requests

## Coverage Goals

### Current Coverage
Run `npm run test:coverage` to see detailed coverage reports.

### Target Coverage
- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

## Continuous Integration

### GitHub Actions Example
```yaml
name: Backend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install Dependencies
      run: |
        cd backend
        npm install
    
    - name: Run Tests
      run: |
        cd backend
        npm test
    
    - name: Generate Coverage
      run: |
        cd backend
        npm run test:coverage
    
    - name: Upload Coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./backend/coverage/lcov.info
```

## Troubleshooting

### Common Issues

#### 1. ES Module Errors
**Problem**: `Cannot use import statement outside a module`

**Solution**: Ensure `"type": "module"` is in `backend/package.json` and use:
```bash
NODE_OPTIONS=--experimental-vm-modules jest
```

#### 2. Module Not Found
**Problem**: `Cannot find module '../env.js'`

**Solution**: Check that file extensions (.js) are included in all imports:
```javascript
import { ENV } from './lib/env.js';  // ✅ Correct
import { ENV } from './lib/env';     // ❌ Wrong
```

#### 3. Test Timeouts
**Problem**: Tests fail with timeout errors

**Solution**: Increase timeout in jest.config.js:
```javascript
testTimeout: 15000  // Increase from 10000
```

Or set timeout per test:
```javascript
it('slow test', async () => {
    // test code
}, 15000);
```

#### 4. Port Already in Use
**Problem**: Server fails to start on port

**Solution**: Tests don't actually listen on ports (Supertest handles this). If you see this error, ensure `app.listen()` is not called in test environment.

#### 5. Mock Module Issues
**Problem**: Mocks not working correctly

**Solution**: Use `jest.resetModules()` and `jest.unstable_mockModule()` for ES modules:
```javascript
beforeEach(() => {
    jest.resetModules();
});
```

## Writing New Tests

### 1. Unit Test Template
```javascript
import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';

describe('Feature Name', () => {
    let app;

    beforeEach(() => {
        app = express();
        // Setup routes
    });

    it('should do something', async () => {
        const response = await request(app).get('/endpoint');
        expect(response.statusCode).toBe(200);
    });
});
```

### 2. Integration Test Template
```javascript
describe('Integration: Multiple Features', () => {
    it('should handle complete workflow', async () => {
        // Step 1
        const result1 = await request(app).get('/endpoint1');
        expect(result1.statusCode).toBe(200);

        // Step 2
        const result2 = await request(app).get('/endpoint2');
        expect(result2.statusCode).toBe(200);

        // Verify interaction
        expect(result1.body).not.toEqual(result2.body);
    });
});
```

### 3. Test Naming Convention
Use descriptive names that explain what is being tested:
- ✅ `should return 200 status code on /health`
- ✅ `should handle undefined PORT`
- ✅ `should maintain stateless behavior across requests`
- ❌ `test1`
- ❌ `works`

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Express Testing Guide](https://expressjs.com/en/guide/testing.html)
- [ES Modules in Jest](https://jestjs.io/docs/ecmascript-modules)

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all existing tests pass
3. Add tests for both success and failure cases
4. Update this documentation if needed
5. Maintain > 90% code coverage

## Support

For issues or questions about the test suite:
1. Check this documentation
2. Review existing test files for examples
3. Check Jest documentation
4. Open an issue in the repository