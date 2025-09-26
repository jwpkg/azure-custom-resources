export interface ResourceIdSegment {
  type: string;
  name: string;
}

export interface ParsedResourceId {
  subscriptionId: string;
  resourceGroup: string;
  providerNamespace: string;
  segments: ResourceIdSegment[];
}

export function parseResourceId(resourceId: string): ParsedResourceId {
  const parts = resourceId.split('/').filter(Boolean);
  if (parts.length < 8) throw new Error(`Invalid resourceId: ${resourceId}`);

  const [subscriptions, subscriptionId, rgKeyword, resourceGroup, providers, providerNamespace, ...rest] = parts;
  if (subscriptions !== 'subscriptions' || rgKeyword !== 'resourceGroups' || providers !== 'providers') {
    throw new Error(`Malformed resourceId: ${resourceId}`);
  }

  // Pair remaining segments as [type, name]
  const segments: ResourceIdSegment[] = [];
  for (let i = 0; i < rest.length; i += 2) {
    const type = rest[i];
    const name = rest[i + 1];
    if (!type || !name) throw new Error(`Invalid type/name pair in resourceId: ${resourceId}`);
    segments.push({ type, name });
  }

  return { subscriptionId, resourceGroup, providerNamespace, segments };
}
export class AzureCustomResourcePath {
  constructor(
    public subscriptionId: string,
    public resourceGroup: string,
    public providerNamespace: string,
    public customProviderName: string,
    public resourceType: string,
    public resourceName: string,
    public isResourcePath: boolean,
  ) {}

  static tryParse(resourceId: string): AzureCustomResourcePath | undefined {
    let parsed: ParsedResourceId;
    try {
      parsed = parseResourceId(resourceId);
    } catch {
      return undefined;
    }

    if (parsed.providerNamespace !== 'Microsoft.CustomProviders') return undefined;
    if (parsed.segments.length < 2) return undefined;

    const [first, second] = parsed.segments;
    if (first.type !== 'resourceProviders') return undefined;

    return new AzureCustomResourcePath(
      parsed.subscriptionId,
      parsed.resourceGroup,
      parsed.providerNamespace,
      first.name,   // customProviderName
      second.type,  // resourceType
      second.name,  // resourceName
      true,
    );
  }

  static parse(resourceId: string): AzureCustomResourcePath {
    const parsed = this.tryParse(resourceId);
    if (!parsed) throw new Error(`Invalid custom resourceId: ${resourceId}`);
    return parsed;
  }
}

export class AzureExtensionResourcePath {
  constructor(
    public subscriptionId: string,
    public resourceGroup: string,
    public resourceName: string,
  ) {}

  static tryParse(resourceId: string): AzureExtensionResourcePath | undefined {
    let parsed: ParsedResourceId;
    try {
      parsed = parseResourceId(resourceId);
    } catch {
      return undefined;
    }

    if (parsed.providerNamespace !== 'Microsoft.CustomProviders') return undefined;
    if (parsed.segments.length !== 2) return undefined;

    const [first, assoc] = parsed.segments;
    if (first.type !== 'associations') return undefined;

    return new AzureExtensionResourcePath(parsed.subscriptionId, parsed.resourceGroup, assoc.name);
  }

  static parse(resourceId: string): AzureExtensionResourcePath {
    const parsed = this.tryParse(resourceId);
    if (!parsed) throw new Error(`Invalid extension resourceId: ${resourceId}`);
    return parsed;
  }
}
