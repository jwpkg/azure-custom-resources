import { InvocationContext } from '@azure/functions';

import { ParsedRequest } from './request';
import { Duration, asyncRequestFirstEpochParam, asyncRequestIdParam, asyncRequestPath, asyncRequestRetryCountParam, asyncRequestTypeParam } from './util';

export interface CacheResponse {
  properties?: Record<string, any>;
}

export interface ProxyResponse extends CacheResponse {
  id: string;
  type: string;
  name: string;
}

export interface CreatedResponse<ResponseType extends CacheResponse> {
  created: ResponseType;
}

export interface UpdatedResponse<ResponseType extends CacheResponse> {
  updated: ResponseType;
}

export type CreateUpdateResponse<ResponseType extends CacheResponse> = CreatedResponse<ResponseType> | UpdatedResponse<ResponseType>;

export interface ErrorResponse {
  status: number;
  errorCode: string;
  errorMessage: string;
}

export interface AsyncResponse {
  async: {
    id?: string;
    retryAfter?: Duration;
  };
}

export function isAsyncResponse(response: any): response is AsyncResponse {
  return response && typeof response === 'object' && 'async' in response;
}

export function isCreatedResponse<ReponseType extends CacheResponse>(response: any): response is CreatedResponse<ReponseType> {
  return response && typeof response === 'object' && 'created' in response;
}

export function isUpdatedResponse<ReponseType extends CacheResponse>(response: any): response is UpdatedResponse<ReponseType> {
  return response && typeof response === 'object' && 'updated' in response;
}

export function makeResponse(statusCode: number, context: InvocationContext, jsonBody?: unknown) {
  const responseObject = jsonBody && typeof jsonBody === 'object' ? jsonBody : {};
  const status = 'statusCode' in responseObject && typeof responseObject.statusCode === 'number' ? responseObject.statusCode : statusCode;
  const result = {
    statusCode: status,
    jsonBody: jsonBody ?? {},
  };
  context.warn('Return response: ', result);
  return result;
}

export function makeAsyncResponse(request: ParsedRequest, context: InvocationContext, response: AsyncResponse) {
  const url = new URL(request.httpRequest.url);

  const type = request.requestType.toLowerCase().includes('create') ? 'create' : 'delete';

  url.searchParams.set(asyncRequestTypeParam, type);
  url.searchParams.set(asyncRequestFirstEpochParam, `${request.asyncFirstCall}`);
  url.searchParams.set(asyncRequestRetryCountParam, `${request.asyncRetryCount + 1}`);
  url.searchParams.set(asyncRequestIdParam, response.async.id ?? '');
  url.searchParams.set(asyncRequestPath, request.requestPath);

  const result = {
    status: 202,
    headers: {
      Location: url.toString(),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'Retry-After': `${response.async.retryAfter?.seconds() ?? 10}`,
    },
  };
  context.warn('Return async response: ', result);
  return result;
}
