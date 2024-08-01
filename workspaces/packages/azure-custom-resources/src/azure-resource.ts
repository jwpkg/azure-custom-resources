export class AzureCustomResourcePath {
  constructor(
    public subscriptionId: string,
    public resourceGroup: string,
    public providerName: string,
    public resourceType: string,
    public resourceName: string,
    public isResourcePath: boolean,
  ) {}

  static tryParse(resourceId: string) {
    const parsedPath = resourceId.match(/^\/subscriptions\/([^/]*)\/resourceGroups\/([^/]*)\/providers\/Microsoft.CustomProviders\/resourceProviders\/([^/]*)\/([^/]*)\/?([^/]*)?$/);

    if (!parsedPath) {
      return undefined;
    }

    const isResourceRequest = parsedPath.length > 5;

    return new AzureCustomResourcePath(
      parsedPath[1],
      parsedPath[2],
      parsedPath[3],
      parsedPath[4],
      isResourceRequest ? parsedPath[5] : '',
      isResourceRequest,
    );
  }

  static parse(resourceId: string) {
    const parsedPath = this.tryParse(resourceId);

    if (!parsedPath) {
      throw new Error(`Invalid request path of '${resourceId}'`);
    }

    return parsedPath;
  }
}

export class AzureExtensionResourcePath {
  constructor(
    public subscriptionId: string,
    public resourceGroup: string,
    public resourceName: string,
  ) {}

  static tryParse(resourceId: string) {
    const parsedPath = resourceId.match(/^\/subscriptions\/([^/]*)\/resourceGroups\/([^/]*)\/providers\/Microsoft.CustomProviders\/associations\/([^/]*)$/);

    if (!parsedPath) {
      return undefined;
    }

    return new AzureExtensionResourcePath(
      parsedPath[1],
      parsedPath[2],
      parsedPath[3],
    );
  }

  static parse(resourceId: string) {
    const parsedPath = this.tryParse(resourceId);

    if (!parsedPath) {
      throw new Error(`Invalid request path of '${resourceId}'`);
    }

    return parsedPath;
  }
}

// 'x-ms-customproviders-extensionpath': '/subscriptions/5cbc3b4c-c4d3-4adb-a492-c29f133c4516/resourceGroups/ne-example-apps    /providers/Microsoft.CustomProviders/associations     /network-rule-35wwure2a5pu4',
// 'x-ms-customproviders-requestpath':   '/subscriptions/5cbc3b4c-c4d3-4adb-a492-c29f133c4516/resourceGroups/ne-network-rules-rg/providers/Microsoft.CustomProviders/resourceProviders/network-rule-provider/associations/network-rule-35wwure2a5pu4',
// X-MS-CustomProviders-RequestPath:      /subscriptions/5cbc3b4c-c4d3-4adb-a492-c29f133c4516/resourceGroups/{resourceGroupName}/providers/Microsoft.CustomProviders/resourceProviders/{resourceProviderName}/myCustomResources/{myCustomResourceName}
