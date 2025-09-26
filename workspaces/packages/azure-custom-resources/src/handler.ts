import { HttpFunctionOptions, HttpHandler, InvocationContext } from '@azure/functions';

import { CoreError, InvalidHandlerError } from './error';
import { Request, requestFromHttpRequest, RequestType } from './request';
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

export function wrapProxyResource(handler: ProxyHandler, route?: string): HttpFunctionOptions {
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

export function wrapAction(handler: ActionHandler, route?: string): HttpFunctionOptions {
  return {
    handler: wrapHandler(handler),
    route,
    methods: [
      'POST',
    ],
  };
}

export function wrapHandler(handler: CacheHandler | ProxyHandler | ActionHandler): HttpHandler {
  return async (req, ctx) => {
    try {
      const crReq = await requestFromHttpRequest(req);

      ctx.warn('Custom resource request:', crReq);

      // Action-only
      if ('execute' in handler) {
        if (crReq.requestType !== 'action') throw new InvalidHandlerError('Unexpected non-action request');
        return makeResponse(200, ctx, (await handler.execute(crReq, ctx)).properties);
      }

      const dispatch: Record<RequestType, () => Promise<any>> = {
        create: async () => {
          const res = await handler.createUpdate(crReq, ctx);
          return isAsyncResponse(res) ? makeAsyncResponse(crReq, ctx, res) :
            isCreatedResponse(res) ? makeResponse(201, ctx, res.created) :
              makeResponse(200, ctx, res.updated);
        },
        delete: async () => {
          const res = await handler.delete(crReq, ctx);
          return isAsyncResponse(res) ? makeAsyncResponse(crReq, ctx, res) : makeResponse(200, ctx);
        },
        asyncCreateStatus: async () => {
          if (!handler.asyncCreateStatus) throw new InvalidHandlerError('asyncCreateStatus not implemented');
          const res = await handler.asyncCreateStatus(crReq, ctx);
          return isAsyncResponse(res) ? makeAsyncResponse(crReq, ctx, res) :
            isCreatedResponse(res) ? makeResponse(201, ctx, res.created) :
              makeResponse(200, ctx, res.updated);
        },
        asyncDeleteStatus: async () => {
          if (!handler.asyncDeleteStatus) throw new InvalidHandlerError('asyncDeleteStatus not implemented');
          const res = await handler.asyncDeleteStatus(crReq, ctx);
          return isAsyncResponse(res) ? makeAsyncResponse(crReq, ctx, res) : makeResponse(200, ctx);
        },
        retrieve: async () => {
          if (!('retrieve' in handler)) throw new InvalidHandlerError('retrieve not implemented');
          return makeResponse(200, ctx, await handler.retrieve(crReq, ctx));
        },
        list: async () => {
          if (!('list' in handler)) throw new InvalidHandlerError('list not implemented');
          return makeResponse(200, ctx, await handler.list(crReq, ctx));
        },
        action: async () => {
          throw new InvalidHandlerError('Action not supported');
        },
      };

      if (!dispatch[crReq.requestType]) throw new InvalidHandlerError('Unsupported request type');
      return await dispatch[crReq.requestType]();
    } catch (err) {
      ctx.error('ERROR', err);
      if (err instanceof CoreError) return err.makeResponse();
      return { statusCode: 500, jsonBody: { error: { code: 'UnknownError', message: String(err) } } };
    }
  };
}
