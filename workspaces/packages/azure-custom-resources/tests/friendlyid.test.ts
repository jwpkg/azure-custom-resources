import { AzureExtensionResourcePath } from '../src/azure-resource';
import { generateFriendlyId } from '../src/friendlyid';
import { Request } from '../src/request';

// Mock request object helper
const createMockRequest = (overrides: Partial<Request> = {}): Request => ({
  httpRequest: {} as any,
  requestPath: '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/myType/myResource',
  subscriptionId: '12345678-1234-1234-1234-123456789012',
  resourceGroup: 'myRG',
  customProviderName: 'myProvider',
  resourceType: 'myType',
  resourceName: 'myResource',
  properties: {},
  asyncTotalTime: { seconds: () => 0, minutes: () => 0, milliseconds: () => 0 } as any,
  asyncRequestType: 'none',
  asyncFirstCall: Date.now(),
  asyncRetryCount: 0,
  asyncStatusId: '',
  ...overrides,
});

describe('generateFriendlyId', () => {
  it('should generate a consistent ID for the same request', () => {
    const request = createMockRequest();
    const id1 = generateFriendlyId('test', request);
    const id2 = generateFriendlyId('test', request);

    expect(id1).toBe(id2);
    expect(id1).toMatch(/^test-[a-zA-Z0-9]+$/);
  });

  it('should generate different IDs for different prefixes', () => {
    const request = createMockRequest();
    const id1 = generateFriendlyId('prefix1', request);
    const id2 = generateFriendlyId('prefix2', request);

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^prefix1-[a-zA-Z0-9]+$/);
    expect(id2).toMatch(/^prefix2-[a-zA-Z0-9]+$/);
  });

  it('should generate different IDs for different subscription IDs', () => {
    const request1 = createMockRequest({ subscriptionId: '11111111-1111-1111-1111-111111111111' });
    const request2 = createMockRequest({ subscriptionId: '22222222-2222-2222-2222-222222222222' });

    const id1 = generateFriendlyId('test', request1);
    const id2 = generateFriendlyId('test', request2);

    expect(id1).not.toBe(id2);
  });

  it('should generate different IDs for different resource groups', () => {
    const request1 = createMockRequest({ resourceGroup: 'rg1' });
    const request2 = createMockRequest({ resourceGroup: 'rg2' });

    const id1 = generateFriendlyId('test', request1);
    const id2 = generateFriendlyId('test', request2);

    expect(id1).not.toBe(id2);
  });

  it('should generate different IDs for different custom provider names', () => {
    const request1 = createMockRequest({ customProviderName: 'provider1' });
    const request2 = createMockRequest({ customProviderName: 'provider2' });

    const id1 = generateFriendlyId('test', request1);
    const id2 = generateFriendlyId('test', request2);

    expect(id1).not.toBe(id2);
  });

  it('should generate different IDs for different resource types', () => {
    const request1 = createMockRequest({ resourceType: 'type1' });
    const request2 = createMockRequest({ resourceType: 'type2' });

    const id1 = generateFriendlyId('test', request1);
    const id2 = generateFriendlyId('test', request2);

    expect(id1).not.toBe(id2);
  });

  it('should generate different IDs for different resource names', () => {
    const request1 = createMockRequest({ resourceName: 'resource1' });
    const request2 = createMockRequest({ resourceName: 'resource2' });

    const id1 = generateFriendlyId('test', request1);
    const id2 = generateFriendlyId('test', request2);

    expect(id1).not.toBe(id2);
  });

  it('should use extension resource properties when available', () => {
    const extensionResource = new AzureExtensionResourcePath(
      '12345678-1234-1234-1234-123456789012',
      'myRG',
      'myExtension',
    );

    const request1 = createMockRequest({ extensionResource });
    const request2 = createMockRequest(); // No extension resource

    const id1 = generateFriendlyId('test', request1);
    const id2 = generateFriendlyId('test', request2);

    expect(id1).not.toBe(id2);
  });

  it('should generate different IDs for different extension resource properties', () => {
    const extensionResource1 = new AzureExtensionResourcePath(
      '11111111-1111-1111-1111-111111111111',
      'rg1',
      'ext1',
    );

    const extensionResource2 = new AzureExtensionResourcePath(
      '22222222-2222-2222-2222-222222222222',
      'rg2',
      'ext2',
    );

    const request1 = createMockRequest({ extensionResource: extensionResource1 });
    const request2 = createMockRequest({ extensionResource: extensionResource2 });

    const id1 = generateFriendlyId('test', request1);
    const id2 = generateFriendlyId('test', request2);

    expect(id1).not.toBe(id2);
  });

  it('should produce base58 encoded suffix', () => {
    const request = createMockRequest();
    const id = generateFriendlyId('test', request);

    // Base58 uses characters 1-9, A-H, J-N, P-Z, a-k, m-z (no 0, O, I, l)
    const suffix = id.split('-')[1];
    expect(suffix).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/);
    expect(suffix.length).toBeGreaterThan(0);
  });
});
