import { ApiDomain } from './types'

export const createHTTPApiDomainBuilder = <TContext>() => {
  return {
    buildDomain: <T extends ApiDomain<TContext>>(api: T): T => {
      return api
    },
  }
}
