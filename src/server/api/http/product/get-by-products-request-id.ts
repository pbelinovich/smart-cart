import joi from 'joi'
import { buildPublicHandler } from '../builder'
import { IPresentProductDto, IAbsentProductDto } from './types'
import {
  getAbsentProductsByHashes,
  getPresentProductsByHashes,
  getProductsByProductsRequestId,
  getProductsRequestById,
  getUserById,
  IAbsentProductEntity,
  IGetProductByProductsRequestIdParams,
  IPresentProductEntity,
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

  const productsRequest = await readExecutor.execute(getProductsRequestById, { id: params.productsRequestId })

  if (!productsRequest) {
    throw new Error('Unable to find products request')
  }

  if (productsRequest.userId !== user.id) {
    throw new Error('User does not have access to this products request')
  }

  const products = await readExecutor.execute(getProductsByProductsRequestId, params)
  const hashes = products.map(x => x.cachedProductHash)

  const [presentProducts, absentProducts] = await Promise.all([
    readExecutor.execute(getPresentProductsByHashes, { hashes }),
    readExecutor.execute(getAbsentProductsByHashes, { hashes }),
    writeExecutor.execute(updateUserLastActivity, { id: user.id }),
  ])

  const hashToPresentProductMap = presentProducts.reduce<{
    [hash: string]: IPresentProductEntity
  }>((acc, product) => {
    acc[product.hash] = product
    return acc
  }, {})

  const hashToAbsentProductMap = absentProducts.reduce<{
    [hash: string]: IAbsentProductEntity
  }>((acc, product) => {
    acc[product.hash] = product
    return acc
  }, {})

  return {
    present: products.reduce<IPresentProductDto[]>((acc, product) => {
      const presentProduct = hashToPresentProductMap[product.cachedProductHash]

      if (presentProduct) {
        acc.push({
          id: product.id,
          createDate: product.createDate,
          quantity: product.quantity,
          cityId: presentProduct.cityId,
          shopId: presentProduct.shopId,
          queryName: presentProduct.queryName,
          productName: presentProduct.productName,
          productPrice: presentProduct.productPrice,
        })
      }

      return acc
    }, []),
    absent: products.reduce<IAbsentProductDto[]>((acc, product) => {
      const presentProduct = hashToPresentProductMap[product.cachedProductHash]
      const absentProduct = hashToAbsentProductMap[product.cachedProductHash]

      if (!presentProduct && absentProduct) {
        acc.push({
          id: product.id,
          createDate: product.createDate,
          quantity: product.quantity,
          cityId: absentProduct.cityId,
          shopId: absentProduct.shopId,
          queryName: absentProduct.queryName,
        })
      }

      return acc
    }, []),
  }
})
