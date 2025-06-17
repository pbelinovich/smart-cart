import { buildPublicHandler } from '../builder'
import { getCartsList } from '../../../external'
import { getPageParamsSchema } from '../common'

export const getPage = buildPublicHandler(getPageParamsSchema, (params, { readExecutor }) => {
  return readExecutor.execute(getCartsList, params)
})
