import { HttpRequest } from '@azure/functions';

import { Duration, asyncRequestFirstEpochParam, asyncRequestIdParam, asyncRequestPath, asyncRequestRetryCountParam, asyncRequestTypeParam } from './util';

export type RequestType = 'create' | 'delete' | 'retrieve' | 'list' | 'action' | 'asyncCreateStatus' | 'asyncDeleteStatus';

export interface ExtensionResource {
  readonly subscription: string;
  readonly resourceGroup: string;
  readonly resourceName: string;
}

export interface Request {
  readonly httpRequest: HttpRequest;

  readonly requestPath: string;

  readonly subscriptionId: string;
  readonly resoureGroup: string;
  readonly providerType: string;
  readonly resourceType: string;
  readonly resourceName: string;
  readonly location?: string;

  readonly extensionResource?:  ExtensionResource;

  readonly properties: Record<string, any>;

  readonly asyncTotalTime: Duration;
  readonly asyncRequestType: 'create' | 'delete' | 'none';
  readonly asyncFirstCall: number;
  readonly asyncRetryCount: number;
  readonly asyncStatusId: string;
}

export interface ParsedRequest extends Request {
  requestType: RequestType;
}

export async function requestFromHttpRequest(request: HttpRequest): Promise<ParsedRequest> {
  const isAsyncStatusRequest = request.method.toUpperCase() === 'GET' && request.query.has(asyncRequestTypeParam);

  const requestPath = isAsyncStatusRequest ? request.query.get(asyncRequestPath) : request.headers.get('x-ms-customproviders-requestpath');

  if (!requestPath) {
    throw new Error('Invalid request. Was expecting the header "x-ms-customproviders-requestpath"');
  }

  const parsedPath = requestPath.match(/^\/subscriptions\/([^/]*)\/resourceGroups\/([^/]*)\/providers\/Microsoft.CustomProviders\/resourceProviders\/([^/]*)\/([^/]*)\/?([^/]*)?$/);

  if (!parsedPath) {
    throw new Error(`Invalid request path of '${requestPath}'`);
  }

  const isResourceRequest = parsedPath.length > 5;

  let requestType: RequestType;

  if (isAsyncStatusRequest) {
    const asyncRequestType = request.query.get(asyncRequestTypeParam)!;
    if (asyncRequestType === 'create') {
      requestType = 'asyncCreateStatus';
    } else if (asyncRequestType === 'delete') {
      requestType = 'asyncDeleteStatus';
    } else {
      throw new Error('Invalida async request type');
    }
  } else {
    switch (request.method.toUpperCase()) {
      case 'POST': requestType = 'action'; break;
      case 'PUT': requestType = 'create'; break;
      case 'DELETE': requestType = 'delete'; break;
      case 'GET': requestType = isResourceRequest ? 'retrieve' : 'list'; break;
      default:
        throw new Error('Invalid request method');
    }
  }

  let properties: Record<string, any> = {};
  let location: string | undefined;
  let extensionResource: ExtensionResource | undefined;

  if (['put', 'post'].includes(request.method.toLowerCase()) && request.body !== null) {
    const bodyContent = await request.json();

    if (bodyContent && typeof bodyContent === 'object') {
      if ('location' in bodyContent && typeof bodyContent.location === 'string') {
        location = bodyContent.location;
      }
      if ('properties' in bodyContent && typeof bodyContent.properties === 'object') {
        properties = bodyContent.properties ?? {};

        // parse extension resources (associations)
        if ('extensionId' in properties && typeof properties.extensionId === 'string') {
          const parsedExtensionId = properties.extensionId.match(/^\/subscriptions\/([^/]*)\/resourceGroups\/([^/]*)\/providers\/Microsoft.CustomProviders\/resourceProviders\/([^/]*)\/([^/]*)\/?([^/]*)?$/);
          if (parsedExtensionId && parsedExtensionId.length > 5) {
            extensionResource = {
              subscription: parsedExtensionId[1],
              resourceGroup: parsedExtensionId[2],
              resourceName: parsedExtensionId[5],
            };
          }
        }
      }
    }
  }

  const asyncRequestFirstEpoch = request.query.get(asyncRequestFirstEpochParam) !== null ?  parseInt(request.query.get(asyncRequestFirstEpochParam)!) : Date.now();

  const result: Request = {
    httpRequest: request,
    requestPath,
    subscriptionId: parsedPath[1],
    resoureGroup: parsedPath[2],
    providerType: parsedPath[3],
    resourceType: parsedPath[4],
    resourceName: isResourceRequest ? parsedPath[5] : '',
    properties,
    location,

    extensionResource,

    asyncRequestType: requestType === 'asyncCreateStatus' ? 'create' : requestType === 'asyncDeleteStatus' ? 'delete' : 'none',
    asyncFirstCall: asyncRequestFirstEpoch,
    asyncRetryCount: request.query.get(asyncRequestRetryCountParam) !== null ? parseInt(request.query.get(asyncRequestRetryCountParam)!) : 0,
    asyncTotalTime: Duration.seconds(request.query.get(asyncRequestFirstEpochParam) !== null ? parseInt(request.query.get(asyncRequestFirstEpochParam)!) : 0),
    asyncStatusId: request.query.get(asyncRequestIdParam) ?? '',
  };

  return {
    ...result,
    requestType,
  };
}
