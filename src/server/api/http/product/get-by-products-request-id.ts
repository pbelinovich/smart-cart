import joi from 'joi'
import { buildPublicHandler } from '../builder'
import { IProductDto } from './types'
import {
  getMarketplaceProductsByHashes,
  getProductsByProductsRequestId,
  getProductsRequestById,
  getUserById,
  IGetProductByProductsRequestIdParams,
  IMarketplaceProductEntity,
  updateUserLastActivity,
} from '../../../external'

const schema = joi.object<IGetProductByProductsRequestIdParams>({
  productsRequestId: joi.string().required(),
  userId: joi.string().required(),
})

export const getByProductsRequestId = buildPublicHandler(schema, async (params, { readExecutor, writeExecutor }) => {
  const user = await readExecutor.execute(getUserById, { id: params.userId })

  if (!user) {
    throw new Error('User does not exist')
  }

  const productsRequestId = await readExecutor.execute(getProductsRequestById, { id: params.productsRequestId })

  if (!productsRequestId) {
    throw new Error('Unable to find products request')
  }

  const [products] = await Promise.all([
    readExecutor.execute(getProductsByProductsRequestId, params),
    writeExecutor.execute(updateUserLastActivity, { id: user.id }),
  ])

  const marketplaceProducts = await readExecutor.execute(getMarketplaceProductsByHashes, {
    hashes: products.map(x => x.marketplaceProductHash),
  })

  const hashToMarketplaceProductMap = marketplaceProducts.reduce<{
    [hash: string]: IMarketplaceProductEntity
  }>((acc, product) => {
    acc[product.hash] = product
    return acc
  }, {})

  return products.reduce<IProductDto[]>((acc, product) => {
    const marketplaceProduct = hashToMarketplaceProductMap[product.marketplaceProductHash]

    if (marketplaceProduct) {
      acc.push({
        id: product.id,
        createDate: product.createDate,
        quantity: product.quantity,
        cityId: marketplaceProduct.cityId,
        shopId: marketplaceProduct.shopId,
        queryName: marketplaceProduct.queryName,
        productName: marketplaceProduct.productName,
        productPrice: marketplaceProduct.productPrice,
      })
    }

    return acc
  }, [])
})
