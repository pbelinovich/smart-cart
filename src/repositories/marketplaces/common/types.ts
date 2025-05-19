import { OutgoingHttpHeaders } from 'node:http'

export interface IMarketplaceRequestParams<TData extends { [key: string]: any }> {
  method: 'GET' | 'POST'
  url: string
  headers?: OutgoingHttpHeaders | string[]
  data: TData
  timeout?: number
}

export type QueryValue = string | number | boolean | null | undefined
export type QueryObject = Record<string, QueryValue | QueryValue[]>
