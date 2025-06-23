import joi from 'joi'
import { buildPublicHandler } from '../builder'
import { getPresentProductsByHashes } from '../../../external'
import { IGetPresentProductByHashParams } from './types'

const schema = joi.object<IGetPresentProductByHashParams>({
  hash: joi.string().required(),
})

export const getByHash = buildPublicHandler(schema, async (params, { readExecutor }) => {
  const presentProducts = await readExecutor.execute(getPresentProductsByHashes, { hashes: [params.hash] })

  if (!presentProducts.length) {
    throw new Error(`Present product by hash "${params.hash}" not found`)
  }

  return presentProducts[0]
})
