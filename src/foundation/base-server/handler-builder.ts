import { Schema } from 'joi'
import { RequestHandler } from './types'
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
