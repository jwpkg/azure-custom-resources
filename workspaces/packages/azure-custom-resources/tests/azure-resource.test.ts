import { parseResourceId, AzureCustomResourcePath, AzureExtensionResourcePath } from '../src/azure-resource';

describe('parseResourceId', () => {
  it('should parse a valid resource ID correctly', () => {
    const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/myType/myResource';
    const result = parseResourceId(resourceId);

    expect(result).toEqual({
      subscriptionId: '12345678-1234-1234-1234-123456789012',
      resourceGroup: 'myRG',
      providerNamespace: 'Microsoft.CustomProviders',
      segments: [
        { type: 'resourceProviders', name: 'myProvider' },
        { type: 'myType', name: 'myResource' },
      ],
    });
  });

  it('should parse a resource ID with multiple segments', () => {
    const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/myType/myResource/subType/subResource';
    const result = parseResourceId(resourceId);

    expect(result).toEqual({
      subscriptionId: '12345678-1234-1234-1234-123456789012',
      resourceGroup: 'myRG',
      providerNamespace: 'Microsoft.CustomProviders',
      segments: [
        { type: 'resourceProviders', name: 'myProvider' },
        { type: 'myType', name: 'myResource' },
        { type: 'subType', name: 'subResource' },
      ],
    });
  });

  it('should throw error for invalid resource ID with insufficient parts', () => {
    const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups';
    expect(() => parseResourceId(resourceId)).toThrow('Invalid resourceId: /subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups');
  });

  it('should throw error for malformed resource ID missing subscriptions keyword', () => {
    const resourceId = '/invalid/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/myType/myResource';
    expect(() => parseResourceId(resourceId)).toThrow('Malformed resourceId: /invalid/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/myType/myResource');
  });

  it('should throw error for malformed resource ID missing resourceGroups keyword', () => {
    const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/invalid/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/myType/myResource';
    expect(() => parseResourceId(resourceId)).toThrow('Malformed resourceId: /subscriptions/12345678-1234-1234-1234-123456789012/invalid/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/myType/myResource');
  });

  it('should throw error for malformed resource ID missing providers keyword', () => {
    const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/invalid/Microsoft.CustomProviders/resourceProviders/myProvider/myType/myResource';
    expect(() => parseResourceId(resourceId)).toThrow('Malformed resourceId: /subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/invalid/Microsoft.CustomProviders/resourceProviders/myProvider/myType/myResource');
  });

  it('should throw error for invalid type/name pairs', () => {
    const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/myType';
    expect(() => parseResourceId(resourceId)).toThrow('Invalid type/name pair in resourceId: /subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/myType');
  });
});

describe('AzureCustomResourcePath', () => {
  describe('tryParse', () => {
    it('should parse a valid custom resource path', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/myType/myResource';
      const result = AzureCustomResourcePath.tryParse(resourceId);

      expect(result).toEqual({
        subscriptionId: '12345678-1234-1234-1234-123456789012',
        resourceGroup: 'myRG',
        providerNamespace: 'Microsoft.CustomProviders',
        customProviderName: 'myProvider',
        resourceType: 'myType',
        resourceName: 'myResource',
        isResourcePath: true,
      });
    });

    it('should return undefined for malformed resource ID', () => {
      const resourceId = '/invalid/resource/id';
      const result = AzureCustomResourcePath.tryParse(resourceId);
      expect(result).toBeUndefined();
    });

    it('should return undefined for non-Microsoft.CustomProviders namespace', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.Storage/storageAccounts/myAccount';
      const result = AzureCustomResourcePath.tryParse(resourceId);
      expect(result).toBeUndefined();
    });

    it('should return undefined for insufficient segments', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders';
      const result = AzureCustomResourcePath.tryParse(resourceId);
      expect(result).toBeUndefined();
    });

    it('should return undefined for non-resourceProviders type', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/invalidType/myProvider/myType/myResource';
      const result = AzureCustomResourcePath.tryParse(resourceId);
      expect(result).toBeUndefined();
    });
  });

  describe('parse', () => {
    it('should parse a valid custom resource path', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/myType/myResource';
      const result = AzureCustomResourcePath.parse(resourceId);

      expect(result).toEqual({
        subscriptionId: '12345678-1234-1234-1234-123456789012',
        resourceGroup: 'myRG',
        providerNamespace: 'Microsoft.CustomProviders',
        customProviderName: 'myProvider',
        resourceType: 'myType',
        resourceName: 'myResource',
        isResourcePath: true,
      });
    });

    it('should throw error for invalid custom resource ID', () => {
      const resourceId = '/invalid/resource/id';
      expect(() => AzureCustomResourcePath.parse(resourceId)).toThrow('Invalid custom resourceId: /invalid/resource/id');
    });

    it('should throw error for non-Microsoft.CustomProviders namespace', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.Storage/storageAccounts/myAccount';
      expect(() => AzureCustomResourcePath.parse(resourceId)).toThrow('Invalid custom resourceId: /subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.Storage/storageAccounts/myAccount');
    });
  });
});

describe('AzureExtensionResourcePath', () => {
  describe('tryParse', () => {
    it('should parse a valid extension resource path', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/associations/myAssociation/extensionType/extensionName';
      const result = AzureExtensionResourcePath.tryParse(resourceId);

      expect(result).toEqual({
        subscriptionId: '12345678-1234-1234-1234-123456789012',
        resourceGroup: 'myRG',
        resourceName: 'extensionName',
      });
    });

    it('should return undefined for malformed resource ID', () => {
      const resourceId = '/invalid/resource/id';
      const result = AzureExtensionResourcePath.tryParse(resourceId);
      expect(result).toBeUndefined();
    });

    it('should return undefined for non-Microsoft.CustomProviders namespace', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.Storage/storageAccounts/myAccount';
      const result = AzureExtensionResourcePath.tryParse(resourceId);
      expect(result).toBeUndefined();
    });

    it('should return undefined for incorrect number of segments (only 1)', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/associations/myAssociation';
      const result = AzureExtensionResourcePath.tryParse(resourceId);
      expect(result).toBeUndefined();
    });

    it('should return undefined for incorrect number of segments (more than 2)', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/associations/myAssociation/extra/segment/more/segments';
      const result = AzureExtensionResourcePath.tryParse(resourceId);
      expect(result).toBeUndefined();
    });

    it('should return undefined for non-associations type', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/invalidType/myResource';
      const result = AzureExtensionResourcePath.tryParse(resourceId);
      expect(result).toBeUndefined();
    });
  });

  describe('parse', () => {
    it('should parse a valid extension resource path', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/associations/myAssociation/extensionType/extensionName';
      const result = AzureExtensionResourcePath.parse(resourceId);

      expect(result).toEqual({
        subscriptionId: '12345678-1234-1234-1234-123456789012',
        resourceGroup: 'myRG',
        resourceName: 'extensionName',
      });
    });

    it('should throw error for invalid extension resource ID', () => {
      const resourceId = '/invalid/resource/id';
      expect(() => AzureExtensionResourcePath.parse(resourceId)).toThrow('Invalid extension resourceId: /invalid/resource/id');
    });

    it('should throw error for non-Microsoft.CustomProviders namespace', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.Storage/storageAccounts/myAccount';
      expect(() => AzureExtensionResourcePath.parse(resourceId)).toThrow('Invalid extension resourceId: /subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.Storage/storageAccounts/myAccount');
    });
  });
});
