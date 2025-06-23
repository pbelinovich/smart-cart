import joi from 'joi'
import { buildPublicHandler } from '../builder'
import { IGetCartProductInStockHashByHashParams, getCartProductInStockHashByHash } from '../../../external'

const schema = joi.object<IGetCartProductInStockHashByHashParams>({ hash: joi.string().required() })

export const getByHash = buildPublicHandler(schema, (params, { readExecutor }) => {
  return readExecutor.execute(getCartProductInStockHashByHash, params)
})
