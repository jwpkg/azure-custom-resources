import { wrapCachedResource, wrapProxyResource, wrapAction } from '../src/handler';

describe('Handler wrappers', () => {
  describe('wrapCachedResource', () => {
    it('should return HttpFunctionOptions with correct methods', () => {
      const mockHandler = {
        createUpdate: jest.fn(),
        delete: jest.fn(),
      };

      const result = wrapCachedResource(mockHandler, '/test-route');

      expect(result.route).toBe('/test-route');
      expect(result.methods).toEqual(['GET', 'DELETE', 'PUT']);
      expect(typeof result.handler).toBe('function');
    });

    it('should work without route parameter', () => {
      const mockHandler = {
        createUpdate: jest.fn(),
        delete: jest.fn(),
      };

      const result = wrapCachedResource(mockHandler);

      expect(result.route).toBeUndefined();
      expect(result.methods).toEqual(['GET', 'DELETE', 'PUT']);
    });
  });

  describe('wrapProxyResource', () => {
    it('should return HttpFunctionOptions with correct methods', () => {
      const mockHandler = {
        createUpdate: jest.fn(),
        delete: jest.fn(),
        retrieve: jest.fn(),
        list: jest.fn(),
      };

      const result = wrapProxyResource(mockHandler, '/proxy-route');

      expect(result.route).toBe('/proxy-route');
      expect(result.methods).toEqual(['GET', 'DELETE', 'PUT']);
      expect(typeof result.handler).toBe('function');
    });
  });

  describe('wrapAction', () => {
    it('should return HttpFunctionOptions with POST method only', () => {
      const mockHandler = {
        execute: jest.fn(),
      };

      const result = wrapAction(mockHandler, '/action-route');

      expect(result.route).toBe('/action-route');
      expect(result.methods).toEqual(['POST']);
      expect(typeof result.handler).toBe('function');
    });
  });
});
