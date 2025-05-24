import { Schema } from 'joi'
import { ChannelRequestHandler, RequestHandler } from './types'
import { DataValidator } from './data-validator'

export const createHandlersBuilder = <TContext>() => {
  return {
    buildHandler: <TParams, TResult>(
      schema: Schema<TParams>,
      handler: (params: TParams, context: TContext) => Promise<TResult> | TResult
    ): RequestHandler<TContext, TParams, TResult> => {
      return { validator: new DataValidator<TParams, Schema<TParams>>(schema), handler }
    },
  }
}

export const createChannelFilterEventMapper =
  <T extends object>() =>
  <TContext, TParams, TResult>(
    handler: RequestHandler<TContext, TParams, TResult>,
    filterMetadataMapper: (params: TParams) => T | undefined
  ): ChannelRequestHandler<TContext, TParams, TResult> => ({
    ...handler,
    filterMetadataMapper,
  })
