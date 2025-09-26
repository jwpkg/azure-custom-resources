export interface ParsedCustomResourceId {
  subscriptionId: string;
  resourceGroup: string;
  providerNamespace: string;   // always "Microsoft.CustomProviders"
  customProviderName: string;  // from resourceProviders/<name>
  resourceType: string;        // e.g. "widgets" or "listDownloadSas"
  resourceName: string;        // may equal resourceType for singleton
}

const CUSTOM_RESOURCE_REGEX =
  /^\/subscriptions\/([^/]+)\/resourceGroups\/([^/]+)\/providers\/Microsoft\.CustomProviders\/resourceProviders\/([^/]+)\/([^/]+)(?:\/([^/]+))?\/?$/;

export function parseCustomResourceId(resourceId: string): ParsedCustomResourceId {
  const match = resourceId.match(CUSTOM_RESOURCE_REGEX);
  if (!match) throw new Error(`Invalid custom resourceId: ${resourceId}`);

  const [, subscriptionId, resourceGroup, customProviderName, resourceType, resourceName] = match;

  return {
    subscriptionId,
    resourceGroup,
    providerNamespace: 'Microsoft.CustomProviders',
    customProviderName,
    resourceType,
    resourceName: resourceName ?? resourceType, // fallback for singleton
  };
}

export class AzureCustomResourcePath {
  constructor(
    public subscriptionId: string,
    public resourceGroup: string,
    public providerNamespace: string,
    public customProviderName: string,
    public resourceType: string,
    public resourceName: string,
    public isResourcePath: boolean = true,
  ) {}

  static tryParse(resourceId: string): AzureCustomResourcePath | undefined {
    try {
      const parsed = parseCustomResourceId(resourceId);
      return new AzureCustomResourcePath(
        parsed.subscriptionId,
        parsed.resourceGroup,
        parsed.providerNamespace,
        parsed.customProviderName,
        parsed.resourceType,
        parsed.resourceName,
        true,
      );
    } catch {
      return undefined;
    }
  }

  static parse(resourceId: string): AzureCustomResourcePath {
    const result = this.tryParse(resourceId);
    if (!result) throw new Error(`Invalid custom resourceId: ${resourceId}`);
    return result;
  }
}

export class AzureExtensionResourcePath {
  constructor(
    public subscriptionId: string,
    public resourceGroup: string,
    public resourceName: string,
    public isResourcePath: boolean = true,
  ) {}

  static tryParse(resourceId: string): AzureExtensionResourcePath | undefined {
    // Expect pattern: /subscriptions/.../resourceGroups/.../providers/Microsoft.CustomProviders/associations/<resourceName>
    const EXTENSION_RESOURCE_REGEX =
      /^\/subscriptions\/([^/]+)\/resourceGroups\/([^/]+)\/providers\/Microsoft\.CustomProviders\/associations\/([^/]+)\/?$/;

    const match = resourceId.match(EXTENSION_RESOURCE_REGEX);
    if (!match) return undefined;

    const [, subscriptionId, resourceGroup, resourceName] = match;

    return new AzureExtensionResourcePath(subscriptionId, resourceGroup, resourceName, true);
  }

  static parse(resourceId: string): AzureExtensionResourcePath {
    const result = this.tryParse(resourceId);
    if (!result) throw new Error(`Invalid extension resourceId: ${resourceId}`);
    return result;
  }
}
