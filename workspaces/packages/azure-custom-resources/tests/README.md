# Unit Tests for azure-custom-resources

This package includes comprehensive unit tests for the Azure Custom Resources library.

## Test Coverage

The test suite covers the following modules:

### Core Modules (100% tested):
- **`error.ts`** - Error classes and error handling (100% coverage)
- **`util.ts`** - Utility functions like Duration class (100% coverage)  
- **`response.ts`** - Response formatting and type guards (100% coverage)
- **`friendlyid.ts`** - Friendly ID generation (100% coverage)

### Resource Parsing (96% tested):
- **`azure-resource.ts`** - Azure resource ID parsing and validation (96% coverage)

### Handler Wrappers (24% tested):
- **`handler.ts`** - HTTP handler wrappers (24% coverage - basic wrapper tests)

### Request Processing (8% tested):
- **`request.ts`** - HTTP request parsing (8% coverage - minimal testing due to complex Azure Functions dependencies)

## Running Tests

```bash
# Run all tests
yarn test

# Run tests with coverage report
yarn test:coverage

# Run tests in watch mode
yarn test:watch
```

## Test Structure

Tests are organized in the `tests/` directory with one test file per source module:

```
tests/
├── azure-resource.test.ts   # Resource ID parsing tests
├── error.test.ts           # Error class tests
├── friendlyid.test.ts      # Friendly ID generation tests
├── handler.test.ts         # Handler wrapper tests
├── response.test.ts        # Response formatting tests
└── util.test.ts           # Utility function tests
```

## Test Features

- **87 total tests** with comprehensive edge case coverage
- **Jest framework** with TypeScript support
- **Mock objects** for Azure Functions interfaces
- **Type safety** with full TypeScript checking
- **Code coverage reporting** with detailed metrics

## Notable Test Cases

### Azure Resource Parsing
- Valid and invalid resource ID formats
- Custom provider vs extension resource patterns
- Edge cases for malformed paths

### Error Handling
- All error types with proper status codes
- Response generation for different error scenarios

### Friendly ID Generation
- Consistent ID generation for same inputs
- Different IDs for different resource properties
- Base58 encoding validation

### Response Processing
- Type guards for different response types
- Async response URL generation with query parameters
- Header formatting for retry mechanisms

### Duration Utilities
- Time unit conversions with ceiling behavior
- Edge cases for fractional values

The test suite provides confidence in the core functionality while acknowledging that the more complex handler and request processing would benefit from integration tests with actual Azure Functions runtime.