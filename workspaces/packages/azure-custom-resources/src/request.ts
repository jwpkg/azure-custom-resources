import { HttpRequest } from '@azure/functions';

import { AzureCustomResourcePath, AzureExtensionResourcePath } from './azure-resource';
import { Duration, asyncRequestFirstEpochParam, asyncRequestIdParam, asyncRequestPath, asyncRequestRetryCountParam, asyncRequestTypeParam } from './util';

export type RequestType = 'create' | 'delete' | 'retrieve' | 'list' | 'action' | 'asyncCreateStatus' | 'asyncDeleteStatus';

export interface Request {
  readonly httpRequest: HttpRequest;

  readonly requestPath: string;

  readonly subscriptionId: string;
  readonly resourceGroup: string;
  readonly customProviderName: string;
  readonly resourceType: string;
  readonly resourceName: string;
  readonly location?: string;

  readonly extensionResource?:  AzureExtensionResourcePath;

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

  const parsedPath = AzureCustomResourcePath.parse(requestPath);

  if (!parsedPath) {
    throw new Error(`Invalid request path of '${requestPath}'`);
  }

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
      case 'GET': requestType = parsedPath.isResourcePath ? 'retrieve' : 'list'; break;
      default:
        throw new Error('Invalid request method');
    }
  }

  let properties: Record<string, any> = {};
  let location: string | undefined;

  const extensionResourceHeader = request.headers.get('x-ms-customproviders-requestpath');
  const extensionResource = extensionResourceHeader ? AzureExtensionResourcePath.tryParse(extensionResourceHeader) : undefined;

  if (['put', 'post'].includes(request.method.toLowerCase()) && request.body !== null) {
    const bodyContent = await request.json();

    if (bodyContent && typeof bodyContent === 'object') {
      if ('location' in bodyContent && typeof bodyContent.location === 'string') {
        location = bodyContent.location;
      }
      if ('properties' in bodyContent && typeof bodyContent.properties === 'object') {
        properties = bodyContent.properties ?? {};
      }
    }
  }

  const asyncRequestFirstEpoch = request.query.get(asyncRequestFirstEpochParam) !== null ?  parseInt(request.query.get(asyncRequestFirstEpochParam)!) : Date.now();

  const result: Request = {
    httpRequest: request,
    requestPath,
    subscriptionId: parsedPath.subscriptionId,
    resourceGroup: parsedPath.resourceGroup,
    customProviderName: parsedPath.customProviderName,
    resourceType: parsedPath.resourceType,
    resourceName: parsedPath.resourceName,
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
