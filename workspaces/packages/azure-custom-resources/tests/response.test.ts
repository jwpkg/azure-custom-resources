import { ParsedRequest } from '../src/request';
import { Duration } from '../src/util';

import {
  isAsyncResponse,
  isCreatedResponse,
  isUpdatedResponse,
  makeResponse,
  makeAsyncResponse,
  CacheResponse,
  CreatedResponse,
  UpdatedResponse,
  AsyncResponse,
} from '../src/response';

// Mock InvocationContext
const mockContext = {
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
} as any;

// Mock ParsedRequest
const mockRequest: ParsedRequest = {
  httpRequest: {
    url: 'https://example.com/test?param=value',
  } as any,
  requestPath: '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/myType/myResource',
  subscriptionId: '12345678-1234-1234-1234-123456789012',
  resourceGroup: 'myRG',
  customProviderName: 'myProvider',
  resourceType: 'myType',
  resourceName: 'myResource',
  properties: {},
  asyncTotalTime: Duration.seconds(0),
  asyncRequestType: 'none',
  asyncFirstCall: Date.now(),
  asyncRetryCount: 0,
  asyncStatusId: '',
  requestType: 'create',
};

describe('Response Type Guards', () => {
  describe('isAsyncResponse', () => {
    it('should return true for valid async response', () => {
      const response: AsyncResponse = {
        async: {
          id: 'test-id',
          retryAfter: Duration.seconds(10),
        },
      };

      expect(isAsyncResponse(response)).toBe(true);
    });

    it('should return true for async response without optional fields', () => {
      const response: AsyncResponse = {
        async: {},
      };

      expect(isAsyncResponse(response)).toBe(true);
    });

    it('should return false for non-async response', () => {
      const response = { data: 'test' };
      expect(isAsyncResponse(response)).toBe(false);
    });

    it('should return falsy for null/undefined', () => {
      expect(isAsyncResponse(null)).toBeFalsy();
      expect(isAsyncResponse(undefined)).toBeFalsy();
    });
  });

  describe('isCreatedResponse', () => {
    it('should return true for valid created response', () => {
      const response: CreatedResponse<CacheResponse> = {
        created: { properties: { id: 'test' } },
      };

      expect(isCreatedResponse(response)).toBe(true);
    });

    it('should return false for non-created response', () => {
      const response = { updated: { properties: { id: 'test' } } };
      expect(isCreatedResponse(response)).toBe(false);
    });

    it('should return falsy for null/undefined', () => {
      expect(isCreatedResponse(null)).toBeFalsy();
      expect(isCreatedResponse(undefined)).toBeFalsy();
    });
  });

  describe('isUpdatedResponse', () => {
    it('should return true for valid updated response', () => {
      const response: UpdatedResponse<CacheResponse> = {
        updated: { properties: { id: 'test' } },
      };

      expect(isUpdatedResponse(response)).toBe(true);
    });

    it('should return false for non-updated response', () => {
      const response = { created: { properties: { id: 'test' } } };
      expect(isUpdatedResponse(response)).toBe(false);
    });

    it('should return falsy for null/undefined', () => {
      expect(isUpdatedResponse(null)).toBeFalsy();
      expect(isUpdatedResponse(undefined)).toBeFalsy();
    });
  });
});

describe('makeResponse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create response with basic parameters', () => {
    const response = makeResponse(200, mockContext, { data: 'test' });

    expect(response).toEqual({
      status: 200,
      jsonBody: { data: 'test' },
    });
    expect(mockContext.warn).toHaveBeenCalledWith('Return response: ', {
      status: 200,
      jsonBody: { data: 'test' },
    });
  });

  it('should create response without body', () => {
    const response = makeResponse(204, mockContext);

    expect(response).toEqual({
      status: 204,
      jsonBody: {},
    });
  });

  it('should override status code if present in response object', () => {
    const response = makeResponse(200, mockContext, { statusCode: 201, data: 'test' });

    expect(response).toEqual({
      status: 201,
      jsonBody: { statusCode: 201, data: 'test' },
    });
  });

  it('should handle non-object jsonBody', () => {
    const response = makeResponse(200, mockContext, 'string response');

    expect(response).toEqual({
      status: 200,
      jsonBody: 'string response',
    });
  });
});

describe('makeAsyncResponse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create async response with basic parameters', () => {
    const asyncResponse: AsyncResponse = {
      async: {
        id: 'test-id',
        retryAfter: Duration.seconds(30),
      },
    };

    const response = makeAsyncResponse(mockRequest, mockContext, asyncResponse);

    expect(response.status).toBe(202);
    expect(response.headers).toBeDefined();
    expect(response.headers?.Location).toContain('https://example.com/test');
    expect(response.headers?.['Retry-After']).toBe('30');
  });

  it('should handle async response without id', () => {
    const asyncResponse: AsyncResponse = {
      async: {
        retryAfter: Duration.seconds(15),
      },
    };

    const response = makeAsyncResponse(mockRequest, mockContext, asyncResponse);

    expect(response.status).toBe(202);
    expect(response.headers?.Location).toContain('async-request-id=');
    expect(response.headers?.['Retry-After']).toBe('15');
  });

  it('should handle async response without retryAfter', () => {
    const asyncResponse: AsyncResponse = {
      async: {
        id: 'test-id',
      },
    };

    const response = makeAsyncResponse(mockRequest, mockContext, asyncResponse);

    expect(response.status).toBe(202);
    expect(response.headers?.['Retry-After']).toBe('10'); // Default
  });

  it('should set correct query parameters for create request', () => {
    const createRequest = { ...mockRequest, requestType: 'create' as const };
    const asyncResponse: AsyncResponse = {
      async: { id: 'test-id' },
    };

    const response = makeAsyncResponse(createRequest, mockContext, asyncResponse);

    expect(response.headers?.Location).toContain('async-request-type=create');
  });

  it('should set correct query parameters for delete request', () => {
    const deleteRequest = { ...mockRequest, requestType: 'delete' as const };
    const asyncResponse: AsyncResponse = {
      async: { id: 'test-id' },
    };

    const response = makeAsyncResponse(deleteRequest, mockContext, asyncResponse);

    expect(response.headers?.Location).toContain('async-request-type=delete');
  });

  it('should increment retry count', () => {
    const requestWithRetry = { ...mockRequest, asyncRetryCount: 2 };
    const asyncResponse: AsyncResponse = {
      async: { id: 'test-id' },
    };

    const response = makeAsyncResponse(requestWithRetry, mockContext, asyncResponse);

    expect(response.headers?.Location).toContain('async-request-retry-count=3');
  });

  it('should preserve original request path', () => {
    const asyncResponse: AsyncResponse = {
      async: { id: 'test-id' },
    };

    const response = makeAsyncResponse(mockRequest, mockContext, asyncResponse);

    expect(response.headers?.Location).toContain(encodeURIComponent(mockRequest.requestPath));
  });

  it('should preserve first call timestamp', () => {
    const requestWithFirstCall = { ...mockRequest, asyncFirstCall: 1234567890 };
    const asyncResponse: AsyncResponse = {
      async: { id: 'test-id' },
    };

    const response = makeAsyncResponse(requestWithFirstCall, mockContext, asyncResponse);

    expect(response.headers?.Location).toContain('async-request-firstEpoch=1234567890');
  });
});
