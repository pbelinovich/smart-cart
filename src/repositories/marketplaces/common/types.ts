import { Agent, OutgoingHttpHeaders } from 'node:http'

export interface IMarketplaceRequestParams<TData extends { [key: string]: any }> {
  method: 'GET' | 'POST'
  url: string
  headers?: OutgoingHttpHeaders | string[]
  agent?: Agent
  data: TData
  timeout?: number
}
