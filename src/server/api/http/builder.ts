import { createHandlersBuilder, createHTTPApiDomainBuilder } from '../../external'
import { PublicHandlersContext } from './types'

export const { buildHandler: buildPublicHandler } = createHandlersBuilder<PublicHandlersContext>()
export const { buildDomain: buildPublicDomain } = createHTTPApiDomainBuilder<PublicHandlersContext>()
