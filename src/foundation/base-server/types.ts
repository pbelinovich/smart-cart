import { Request } from 'express'
import { ParamsDictionary, Response } from 'express-serve-static-core'
import { ParsedQs } from 'qs'

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

export type ApiDomain<TContext> = {
  [serviceName: string]: {
    POST?: {
      [handlerName: string]: RequestHandler<TContext, any, any>
    }
    GET?: {
      [handlerName: string]: RequestHandler<TContext, any, any>
    }
  }
}

export type HTTPRequest = Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>
export type HTTPResponse = Response<any, Record<string, any>, number>
