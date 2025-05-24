import axios from 'axios'
import { applyPatch, deepClone } from 'fast-json-patch'
import isEqual from 'react-fast-compare'
import { Observer, createObserver, CONNECTION_ID_HEADER_NAME, delay } from '@shared'
import { buildSseClient } from './sse-client-builder'
import {
  ApiDomain,
  RequestHandler,
  IChannelInitialResponse,
  IChannelUpdateResponse,
  IChannelDiffUpdateResponse,
  ChannelRequestHandler,
} from '@server'

const methods: { [K in keyof ApiDomain<any>['']]: true } = {
  GET: true,
  POST: true,
  CHANNEL: true,
}

export interface ChannelObserver<T, TParams> extends Omit<Observer<T>, 'trigger'> {
  destroy: () => Promise<void>
  updateParams: (params: TParams) => Promise<{ success: true } | 'paramsNotChanged'>
}

const createHandlerProxy = (baseUrl: string, domain: string, service: string, methodKind: keyof ApiDomain<any>['']) =>
  new Proxy(
    {},
    {
      get(_, handlerName: string) {
        const url = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}${domain ? `${domain}/` : ''}${service}/${methodKind}/${handlerName}`
        console.log('!!url', url)
        if (methodKind === 'GET' || methodKind === 'POST') {
          return (params: any) =>
            axios({
              url,
              params: methodKind === 'POST' ? undefined : params,
              data: methodKind === 'POST' ? params : undefined,
              method: methodKind,
              responseType: 'json',
            }).then(x => x.data)
        }

        if (methodKind === 'CHANNEL') {
          return async (params: any) => {
            const sseClient = buildSseClient(baseUrl, 'events')

            /* axios.interceptors.request.use(config => {
              config.headers[CONNECTION_ID_HEADER_NAME] = sseClient.connectionIdObserver.getValue()
              return config
            }) */

            sseClient.connect()

            await delay(3000)
            console.log('!!after delay', sseClient.connectionIdObserver.getValue())

            const initial = await axios<IChannelInitialResponse>({
              url,
              data: params,
              method: 'POST',
              responseType: 'json',
              headers: {
                [CONNECTION_ID_HEADER_NAME]: sseClient.connectionIdObserver.getValue(),
              },
            }).then(x => {
              return x.data
            })
            let revision: number | undefined = undefined
            const channelValueObserver = createObserver(initial.result)
            const unsubFromSSEUpdateDiff = sseClient.onEvent<IChannelDiffUpdateResponse>('channelUpdateDiff', data => {
              if (data.channelId !== initial.channelId) {
                return
              }
              if (revision !== undefined && data.revision - 1 !== revision) {
                throw new Error('Unable to update channels data due to skipped revision')
              }
              revision = data.revision
              const res = applyPatch(deepClone(channelValueObserver.getValue()), data.diff)
              channelValueObserver.trigger(res.newDocument)
            })
            const unsubFromSSEUpdate = sseClient.onEvent<IChannelUpdateResponse>('channelUpdate', data => {
              if (data.channelId !== initial.channelId) {
                return
              }
              channelValueObserver.trigger(data.result)
              revision = data.revision
            })

            let lastParams = params
            const channelObserver: ChannelObserver<any, any> = {
              destroy: async () => {
                unsubFromSSEUpdateDiff()
                unsubFromSSEUpdate()
                await axios({
                  url: `${url.endsWith('/') ? '' : '/'}destroy?id=${initial.channelId}`,
                  headers: {
                    [CONNECTION_ID_HEADER_NAME]: sseClient.connectionIdObserver.getValue(),
                  },
                })
                sseClient.disconnect()
              },
              getValue: () => channelValueObserver.getValue(),
              subscribe: channelValueObserver.subscribe,
              subscribeToValue: channelValueObserver.subscribeToValue,
              updateParams: async (params: any) => {
                if (isEqual(lastParams, params)) {
                  return Promise.resolve('paramsNotChanged')
                }
                lastParams = params
                return await axios<{ success: true }>({
                  url: `${url.endsWith('/') ? '' : '/'}updateParams?id=${initial.channelId}`,
                  method: 'post',
                  data: params,
                  responseType: 'json',
                  headers: {
                    [CONNECTION_ID_HEADER_NAME]: sseClient.connectionIdObserver.getValue(),
                  },
                }).then(x => x.data)
              },
            }

            return channelObserver
          }
        }
      },
    }
  )

const createMethodProxy = (baseUrl: string, domain: string, service: string) =>
  new Proxy(
    {},
    {
      get(_, methodName: keyof ApiDomain<any>['']) {
        if (!methods[methodName]) {
          throw new Error('Unknown method kind ' + methodName)
        }
        return createHandlerProxy(baseUrl, domain, service, methodName)
      },
    }
  )

const createServiceProxy = (baseUrl: string, domainName: string = '') =>
  new Proxy(
    {},
    {
      get(_, serviceName: string) {
        return createMethodProxy(baseUrl, domainName, serviceName)
      },
    }
  )

type RequestHandlerClient<T> = T extends RequestHandler<any, infer TParams, infer TResult> ? (params: TParams) => Promise<TResult> : unknown
type RequestChannelHandlerClient<T> = T extends ChannelRequestHandler<any, infer TParams, infer TResult>
  ? (params: TParams) => Promise<ChannelObserver<TResult, TParams>>
  : unknown

export type ApiDomainClient<T extends ApiDomain<any>> = {
  [K in keyof T]: {
    GET: {
      [KMethod in keyof Required<T[K]>['GET']]: RequestHandlerClient<T[K]['GET'][KMethod]>
    }
    POST: {
      [KMethod in keyof Required<T[K]>['POST']]: RequestHandlerClient<T[K]['POST'][KMethod]>
    }
    CHANNEL: {
      [KMethod in keyof Required<T[K]>['CHANNEL']]: RequestChannelHandlerClient<T[K]['CHANNEL'][KMethod]>
    }
  }
}

export const createApiClient = <T extends ApiDomain<any>>(baseUrl: string, domainName?: string): ApiDomainClient<T> =>
  createServiceProxy(baseUrl, domainName) as any

export const channelParamsMapper = <T, TParams, TMappedParams>(
  channelGetter: (params: TParams) => Promise<ChannelObserver<T, TParams>>,
  mapper: (params: TMappedParams) => TParams
): ((params: TMappedParams) => Promise<ChannelObserver<T, TMappedParams>>) => {
  return async (params: TMappedParams) => {
    const channel = await channelGetter(mapper(params))
    return {
      ...channel,
      updateParams: (params: TMappedParams) => {
        return channel.updateParams(mapper(params))
      },
    }
  }
}
