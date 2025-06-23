import { dateTime } from '@shared'
import { buildWriteOperation } from '../../../common/write'
import { getPresentProductsByHashes } from '../../present-product/read'

export interface IUpdateCartProductInStockParams {
  cartId: string
  hash: string
  marketplaceId: string
}

export const updateCartProductInStock = buildWriteOperation(async (context, params: IUpdateCartProductInStockParams, { execute }) => {
  const [cart, presentProducts] = await Promise.all([
    context.cartRepo.getById(params.cartId),
    execute(getPresentProductsByHashes, { hashes: [params.hash] }),
  ])

  if (!presentProducts.length) {
    throw new Error(`Present product by hash "${params.hash}" not found`)
  }

  const presentProduct = presentProducts[0]
  const marketplaceProduct = presentProduct.marketplaceProducts.find(p => p.id === params.marketplaceId)

  if (!marketplaceProduct) {
    throw new Error(`Marketplace product by id "${params.marketplaceId}" in present product by hash "${params.hash}" not found`)
  }

  let nextTotalPrice = 0

  const nextProductsInStock = cart.productsInStock.data.map(prevProductInStock => {
    let nextProductInStock = prevProductInStock

    if (prevProductInStock.hash === presentProduct.hash) {
      nextProductInStock = {
        ...prevProductInStock,
        marketplaceId: marketplaceProduct.id,
        marketplaceName: marketplaceProduct.name,
        marketplacePrice: marketplaceProduct.price,
      }
    }

    nextTotalPrice += nextProductInStock.marketplacePrice * nextProductInStock.quantity

    return nextProductInStock
  })

  return context.cartRepo.update({
    id: cart.id,
    modifyDate: dateTime.utc().toISOString(),
    productsInStock: { data: nextProductsInStock, total: nextProductsInStock.length },
    totalPrice: nextTotalPrice,
  })
}, [])
