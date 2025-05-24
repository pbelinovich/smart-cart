import { Request } from 'express'
import { ParamsDictionary, Response } from 'express-serve-static-core'
import { ParsedQs } from 'qs'
import { IReadOnlyRepo } from '../repository'
import { Operation } from 'fast-json-patch'

export interface IDataValidator<T> {
  Type: T
  validate: (data: any) => string | undefined
}

export type RequestGuardianErrorResult = {
  code: number
  errorText: string
}

export type RequestHandler<TContext, TParams, TResult> = {
  validator: IDataValidator<TParams>
  handler: (params: TParams, context: TContext) => Promise<TResult> | TResult
}

export type ChannelRequestHandler<TContext, TParams, TResult> = RequestHandler<TContext, TParams, TResult> & {
  filterMetadataMapper: (params: any) => object | undefined
}

export type ApiDomain<TContext> = {
  [serviceName: string]: {
    POST?: {
      [handlerName: string]: RequestHandler<TContext, any, any>
    }
    GET?: {
      [handlerName: string]: RequestHandler<TContext, any, any>
    }
    CHANNEL?: {
      [handlerName: string]: ChannelRequestHandler<TContext, any, any>
    }
  }
}

export type HTTPRequest = Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>
export type HTTPResponse = Response<any, Record<string, any>, number>

export interface IChannelCreateResponse<TResult> {
  channelId: string
  result: TResult
}

export interface IChannelStoreItem<TParams, TResult> {
  id: string
  revision: number
  getHandler: (onUseRepo: (repo: IReadOnlyRepo<any>) => void) => (params: any) => Promise<TResult>
  params: TParams
  destroy: () => void
  lastResult: any
  recalculate: () => Promise<any>
  paramsValidator: IDataValidator<any>
}

export interface IChannelInitialResponse {
  channelId: string
  result: any
}

export interface IChannelDiffUpdateResponse {
  channelId: string
  diff: Operation[]
  revision: number
}

export interface IChannelUpdateResponse {
  channelId: string
  result: any
  revision: number
}

export type ChannelOpenEvent = { kind: 'open'; browserId: string; connectionId: string; req: Request }
export type ChannelCloseEvent = { kind: 'close'; connectionId: string }
export type ChannelEvent = ChannelOpenEvent | ChannelCloseEvent
export type ChannelSub = (event: ChannelEvent) => void
