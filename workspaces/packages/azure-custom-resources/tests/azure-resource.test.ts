import { parseCustomResourceId, AzureCustomResourcePath, AzureExtensionResourcePath } from '../src/azure-resource';

describe('parseCustomResourceId', () => {
  it('should parse a valid custom resource ID with resource name', () => {
    const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/widgets/widget1';
    const result = parseCustomResourceId(resourceId);

    expect(result).toEqual({
      subscriptionId: '12345678-1234-1234-1234-123456789012',
      resourceGroup: 'myRG',
      providerNamespace: 'Microsoft.CustomProviders',
      customProviderName: 'myProvider',
      resourceType: 'widgets',
      resourceName: 'widget1',
    });
  });

  it('should parse a valid custom resource ID without resource name (singleton)', () => {
    const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/bicep-asset/providers/Microsoft.CustomProviders/resourceProviders/asset-sas-provider/listDownloadSas';
    const result = parseCustomResourceId(resourceId);

    expect(result).toEqual({
      subscriptionId: '12345678-1234-1234-1234-123456789012',
      resourceGroup: 'bicep-asset',
      providerNamespace: 'Microsoft.CustomProviders',
      customProviderName: 'asset-sas-provider',
      resourceType: 'listDownloadSas',
      resourceName: 'listDownloadSas', // falls back to resourceType for singleton
    });
  });

  it('should parse a custom resource ID with trailing slash', () => {
    const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/widgets/widget1/';
    const result = parseCustomResourceId(resourceId);

    expect(result).toEqual({
      subscriptionId: '12345678-1234-1234-1234-123456789012',
      resourceGroup: 'myRG',
      providerNamespace: 'Microsoft.CustomProviders',
      customProviderName: 'myProvider',
      resourceType: 'widgets',
      resourceName: 'widget1',
    });
  });

  it('should throw error for invalid resource ID - insufficient parts', () => {
    const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups';
    expect(() => parseCustomResourceId(resourceId)).toThrow('Invalid custom resourceId: /subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups');
  });

  it('should throw error for invalid resource ID - wrong provider namespace', () => {
    const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.Storage/storageAccounts/myAccount';
    expect(() => parseCustomResourceId(resourceId)).toThrow('Invalid custom resourceId: /subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.Storage/storageAccounts/myAccount');
  });

  it('should throw error for invalid resource ID - missing resourceProviders', () => {
    const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/widgets/widget1';
    expect(() => parseCustomResourceId(resourceId)).toThrow('Invalid custom resourceId: /subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/widgets/widget1');
  });

  it('should throw error for invalid resource ID - missing resource type', () => {
    const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider';
    expect(() => parseCustomResourceId(resourceId)).toThrow('Invalid custom resourceId: /subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider');
  });

  it('should throw error for malformed resource ID - missing subscriptions', () => {
    const resourceId = '/invalid/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/widgets/widget1';
    expect(() => parseCustomResourceId(resourceId)).toThrow('Invalid custom resourceId: /invalid/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/widgets/widget1');
  });

  it('should throw error for malformed resource ID - missing resourceGroups', () => {
    const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/invalid/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/widgets/widget1';
    expect(() => parseCustomResourceId(resourceId)).toThrow('Invalid custom resourceId: /subscriptions/12345678-1234-1234-1234-123456789012/invalid/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/widgets/widget1');
  });

  it('should throw error for malformed resource ID - missing providers', () => {
    const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/invalid/Microsoft.CustomProviders/resourceProviders/myProvider/widgets/widget1';
    expect(() => parseCustomResourceId(resourceId)).toThrow('Invalid custom resourceId: /subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/invalid/Microsoft.CustomProviders/resourceProviders/myProvider/widgets/widget1');
  });

  it('should handle empty subscription ID', () => {
    const resourceId = '/subscriptions//resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/widgets/widget1';
    expect(() => parseCustomResourceId(resourceId)).toThrow('Invalid custom resourceId: /subscriptions//resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/widgets/widget1');
  });

  it('should handle empty resource group', () => {
    const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups//providers/Microsoft.CustomProviders/resourceProviders/myProvider/widgets/widget1';
    expect(() => parseCustomResourceId(resourceId)).toThrow('Invalid custom resourceId: /subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups//providers/Microsoft.CustomProviders/resourceProviders/myProvider/widgets/widget1');
  });

  it('should handle empty custom provider name', () => {
    const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders//widgets/widget1';
    expect(() => parseCustomResourceId(resourceId)).toThrow('Invalid custom resourceId: /subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders//widgets/widget1');
  });

  it('should handle empty resource type', () => {
    const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider//widget1';
    expect(() => parseCustomResourceId(resourceId)).toThrow('Invalid custom resourceId: /subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider//widget1');
  });
});

describe('AzureCustomResourcePath', () => {
  describe('tryParse', () => {
    it('should parse a valid custom resource path with resource name', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/widgets/widget1';
      const result = AzureCustomResourcePath.tryParse(resourceId);

      expect(result).toEqual({
        subscriptionId: '12345678-1234-1234-1234-123456789012',
        resourceGroup: 'myRG',
        providerNamespace: 'Microsoft.CustomProviders',
        customProviderName: 'myProvider',
        resourceType: 'widgets',
        resourceName: 'widget1',
        isResourcePath: true,
      });
    });

    it('should parse a valid custom resource path without resource name (singleton)', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/bicep-assets/providers/Microsoft.CustomProviders/resourceProviders/asset-sas-provider/listDownloadSas';
      const result = AzureCustomResourcePath.tryParse(resourceId);

      expect(result).toEqual({
        subscriptionId: '12345678-1234-1234-1234-123456789012',
        resourceGroup: 'bicep-assets',
        providerNamespace: 'Microsoft.CustomProviders',
        customProviderName: 'asset-sas-provider',
        resourceType: 'listDownloadSas',
        resourceName: 'listDownloadSas',
        isResourcePath: true,
      });
    });

    it('should parse a custom resource path with trailing slash', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/widgets/widget1/';
      const result = AzureCustomResourcePath.tryParse(resourceId);

      expect(result).toEqual({
        subscriptionId: '12345678-1234-1234-1234-123456789012',
        resourceGroup: 'myRG',
        providerNamespace: 'Microsoft.CustomProviders',
        customProviderName: 'myProvider',
        resourceType: 'widgets',
        resourceName: 'widget1',
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

    it('should return undefined for missing resourceProviders', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/widgets/widget1';
      const result = AzureCustomResourcePath.tryParse(resourceId);
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty subscription ID', () => {
      const resourceId = '/subscriptions//resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/widgets/widget1';
      const result = AzureCustomResourcePath.tryParse(resourceId);
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty resource group', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups//providers/Microsoft.CustomProviders/resourceProviders/myProvider/widgets/widget1';
      const result = AzureCustomResourcePath.tryParse(resourceId);
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty custom provider name', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders//widgets/widget1';
      const result = AzureCustomResourcePath.tryParse(resourceId);
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty resource type', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider//widget1';
      const result = AzureCustomResourcePath.tryParse(resourceId);
      expect(result).toBeUndefined();
    });
  });

  describe('parse', () => {
    it('should parse a valid custom resource path with resource name', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/widgets/widget1';
      const result = AzureCustomResourcePath.parse(resourceId);

      expect(result).toEqual({
        subscriptionId: '12345678-1234-1234-1234-123456789012',
        resourceGroup: 'myRG',
        providerNamespace: 'Microsoft.CustomProviders',
        customProviderName: 'myProvider',
        resourceType: 'widgets',
        resourceName: 'widget1',
        isResourcePath: true,
      });
    });

    it('should parse a valid custom resource path without resource name (singleton)', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/bicep-assets/providers/Microsoft.CustomProviders/resourceProviders/asset-sas-provider/listDownloadSas';
      const result = AzureCustomResourcePath.parse(resourceId);

      expect(result).toEqual({
        subscriptionId: '12345678-1234-1234-1234-123456789012',
        resourceGroup: 'bicep-assets',
        providerNamespace: 'Microsoft.CustomProviders',
        customProviderName: 'asset-sas-provider',
        resourceType: 'listDownloadSas',
        resourceName: 'listDownloadSas',
        isResourcePath: true,
      });
    });

    it('should parse a custom resource path with trailing slash', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders/myProvider/widgets/widget1/';
      const result = AzureCustomResourcePath.parse(resourceId);

      expect(result).toEqual({
        subscriptionId: '12345678-1234-1234-1234-123456789012',
        resourceGroup: 'myRG',
        providerNamespace: 'Microsoft.CustomProviders',
        customProviderName: 'myProvider',
        resourceType: 'widgets',
        resourceName: 'widget1',
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

    it('should throw error for insufficient segments', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders';
      expect(() => AzureCustomResourcePath.parse(resourceId)).toThrow('Invalid custom resourceId: /subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/resourceProviders');
    });

    it('should throw error for missing resourceProviders', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/widgets/widget1';
      expect(() => AzureCustomResourcePath.parse(resourceId)).toThrow('Invalid custom resourceId: /subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/widgets/widget1');
    });
  });
});

describe('AzureExtensionResourcePath', () => {
  describe('tryParse', () => {
    it('should parse a valid extension resource path', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/associations/myAssociation';
      const result = AzureExtensionResourcePath.tryParse(resourceId);

      expect(result).toEqual({
        subscriptionId: '12345678-1234-1234-1234-123456789012',
        resourceGroup: 'myRG',
        resourceName: 'myAssociation',
        isResourcePath: true,
      });
    });

    it('should parse a valid extension resource path with trailing slash', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/associations/myAssociation/';
      const result = AzureExtensionResourcePath.tryParse(resourceId);

      expect(result).toEqual({
        subscriptionId: '12345678-1234-1234-1234-123456789012',
        resourceGroup: 'myRG',
        resourceName: 'myAssociation',
        isResourcePath: true,
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

    it('should return undefined for missing associations', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/myAssociation';
      const result = AzureExtensionResourcePath.tryParse(resourceId);
      expect(result).toBeUndefined();
    });

    it('should return undefined for non-associations type', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/invalidType/myResource';
      const result = AzureExtensionResourcePath.tryParse(resourceId);
      expect(result).toBeUndefined();
    });

    it('should return undefined for missing resource name', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/associations';
      const result = AzureExtensionResourcePath.tryParse(resourceId);
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty subscription ID', () => {
      const resourceId = '/subscriptions//resourceGroups/myRG/providers/Microsoft.CustomProviders/associations/myAssociation';
      const result = AzureExtensionResourcePath.tryParse(resourceId);
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty resource group', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups//providers/Microsoft.CustomProviders/associations/myAssociation';
      const result = AzureExtensionResourcePath.tryParse(resourceId);
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty resource name', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/associations/';
      const result = AzureExtensionResourcePath.tryParse(resourceId);
      expect(result).toBeUndefined();
    });
  });

  describe('parse', () => {
    it('should parse a valid extension resource path', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/associations/myAssociation';
      const result = AzureExtensionResourcePath.parse(resourceId);

      expect(result).toEqual({
        subscriptionId: '12345678-1234-1234-1234-123456789012',
        resourceGroup: 'myRG',
        resourceName: 'myAssociation',
        isResourcePath: true,
      });
    });

    it('should parse a valid extension resource path with trailing slash', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/associations/myAssociation/';
      const result = AzureExtensionResourcePath.parse(resourceId);

      expect(result).toEqual({
        subscriptionId: '12345678-1234-1234-1234-123456789012',
        resourceGroup: 'myRG',
        resourceName: 'myAssociation',
        isResourcePath: true,
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

    it('should throw error for missing associations', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/myAssociation';
      expect(() => AzureExtensionResourcePath.parse(resourceId)).toThrow('Invalid extension resourceId: /subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/myAssociation');
    });

    it('should throw error for non-associations type', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/invalidType/myResource';
      expect(() => AzureExtensionResourcePath.parse(resourceId)).toThrow('Invalid extension resourceId: /subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/invalidType/myResource');
    });

    it('should throw error for missing resource name', () => {
      const resourceId = '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/associations';
      expect(() => AzureExtensionResourcePath.parse(resourceId)).toThrow('Invalid extension resourceId: /subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/myRG/providers/Microsoft.CustomProviders/associations');
    });
  });
});
