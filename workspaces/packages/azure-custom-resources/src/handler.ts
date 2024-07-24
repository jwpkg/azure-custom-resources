import { HttpFunctionOptions, HttpHandler, InvocationContext } from '@azure/functions';

import { CoreError, InvalidHandlerError } from './error';
import { Request, requestFromHttpRequest } from './request';
import { AsyncResponse, CacheResponse, CreateUpdateResponse, ProxyResponse, isAsyncResponse, isCreatedResponse, makeAsyncResponse, makeResponse } from './response';

export interface BaseHandler<ReponseType extends CacheResponse> {
  createUpdate(request: Request, context: InvocationContext): Promise<CreateUpdateResponse<ReponseType> | AsyncResponse>;
  delete(request: Request, context: InvocationContext): Promise<void>;

  asyncCreateStatus?(request: Request, context: InvocationContext): Promise<CreateUpdateResponse<ReponseType> | AsyncResponse>;
  asyncDeleteStatus?(request: Request, context: InvocationContext): Promise<void>;
}

export interface ProxyHandler extends BaseHandler<ProxyResponse> {
  createUpdate(request: Request, context: InvocationContext): Promise<CreateUpdateResponse<ProxyResponse> | AsyncResponse>;
  delete(request: Request, context: InvocationContext): Promise<void>;
  retrieve(request: Request, context: InvocationContext): Promise<ProxyResponse>;
  list(request: Request, context: InvocationContext): Promise<ProxyResponse[]>;
}

export interface CacheHandler extends BaseHandler<CacheResponse> {
}

export interface ActionHandler {
  execute(request: Request, context: InvocationContext): Promise<CacheResponse>;
}


export function wrapCachedResource(handler: CacheHandler, route?: string): HttpFunctionOptions {
  return {
    handler: wrapHandler(handler),
    route,
    methods: [
      'GET',
      'DELETE',
      'PUT',
    ],
  };
}

export function wrapProxyResource(handler: ProxyHandler): HttpFunctionOptions {
  return {
    handler: wrapHandler(handler),
    methods: [
      'GET',
      'DELETE',
      'PUT',
    ],
  };
}

export function wrapAction(handler: ActionHandler): HttpFunctionOptions {
  return {
    handler: wrapHandler(handler),
    methods: [
      'POST',
    ],
  };
}

export function wrapHandler(handler: CacheHandler | ProxyHandler | ActionHandler): HttpHandler {
  return async (request, context) => {
    //TODO: Validate header "x-arr-clientcert" against certificate

    context.warn('Initialized custom resource event');
    try {
      context.warn('REQUEST', request.method, request.url, request.query);
      context.warn('HEADERS', Object.fromEntries(request.headers));

      const customResourceRequest = await requestFromHttpRequest(request);

      context.warn('Custom resource request:', customResourceRequest);

      if ('execute' in handler) {
        if (customResourceRequest.requestType === 'action') {
          const result = await handler.execute(customResourceRequest, context);
          return makeResponse(200, context, result.properties);
        } else {
          throw new InvalidHandlerError('No action handler configured for action request');
        }
      }

      switch (customResourceRequest.requestType) {
        case 'create': {
          const result = await handler.createUpdate(customResourceRequest, context);

          if (isAsyncResponse(result)) {
            return makeAsyncResponse(customResourceRequest, context, result);
          } else if (isCreatedResponse(result)) {
            return makeResponse(201, context, result.created);
          } else {
            return makeResponse(200, context, result.updated);
          }
        }

        case 'delete': {
          const result = await handler.delete(customResourceRequest, context);
          if (isAsyncResponse(result)) {
            return makeAsyncResponse(customResourceRequest, context, result);
          } else {
            return makeResponse(200, context);
          }
        }

        case 'asyncCreateStatus': {
          if (!handler.asyncCreateStatus) {
            throw new InvalidHandlerError('Recieved an async create status but method not implemented. Please implement asyncCreateStatus');
          }
          const result = await handler.asyncCreateStatus(customResourceRequest, context);

          if (isAsyncResponse(result)) {
            return makeAsyncResponse(customResourceRequest, context, result);
          } else if (isCreatedResponse(result)) {
            return makeResponse(201, context, result.created);
          } else {
            return makeResponse(200, context, result.updated);
          }
        }

        case 'asyncDeleteStatus': {
          if (!handler.asyncDeleteStatus) {
            throw new InvalidHandlerError('Recieved an async delete status but method not implemented. Please implement asyncDeleteStatus');
          }
          const result = await handler.asyncDeleteStatus(customResourceRequest, context);
          if (isAsyncResponse(result)) {
            return makeAsyncResponse(customResourceRequest, context, result);
          } else {
            return makeResponse(200, context);
          }
        }

        case 'retrieve': {
          if (!('retrieve' in handler)) {
            throw new InvalidHandlerError('Recieved a retrieve event but the method is not implemented');
          }

          const result = await handler.createUpdate(customResourceRequest, context);
          return makeResponse(200, context, result);
        }

        case 'list': {
          if (!('list' in handler)) {
            throw new InvalidHandlerError('Recieved a list event but the method is not implemented');
          }
          const result = await handler.list(customResourceRequest, context);
          return makeResponse(200, context, result);
        }
      }

      throw new InvalidHandlerError('Invalid request type for a custom resource');
    } catch (error) {
      context.error('ERROR', error);

      if (error instanceof CoreError) {
        return error.makeResponse();
      }
      return {
        status: 500,
        jsonBody: {
          error: {
            code: 'UnknownError',
            message: `${error}`,
          },
        },
      };
    }
  };
}
