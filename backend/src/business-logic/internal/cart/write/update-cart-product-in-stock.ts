import { dateTime } from '@shared'
import { buildWriteOperation } from '../../../common/write'
import { relatedEntitiesExist } from '../../../common/guardians'
import { getPresentProductsByHashes } from '../../present-product/read'

export interface IUpdateCartProductInStockParams {
  productsRequestId: string
  cartId: string
  hash: string
  marketplaceId: string
}

export const updateCartProductInStock = buildWriteOperation(
  async (context, params: IUpdateCartProductInStockParams, { execute }) => {
    const [cart, presentProducts] = await Promise.all([
      context.cartRepo.getById(params.cartId),
      execute(getPresentProductsByHashes, { hashes: [params.hash] }),
    ])

    if (!presentProducts.length) {
      throw new Error(`Present product by hash "${params.hash}" not found`)
    }

    const presentProduct = presentProducts[0]
    const prevMarketplaceProduct = presentProduct.marketplaceProducts.find(p => p.id === params.marketplaceId)

    if (!prevMarketplaceProduct) {
      throw new Error(`Marketplace product by id "${params.marketplaceId}" in present product by hash "${params.hash}" not found`)
    }

    let nextTotalPrice = 0

    const nextProductsInStock = cart.productsInStock.data.map(prevProductInStock => {
      let nextProductInStock = prevProductInStock

      if (prevProductInStock.hash === presentProduct.hash) {
        nextProductInStock = {
          ...prevProductInStock,
          marketplaceId: prevMarketplaceProduct.id,
          marketplaceName: prevMarketplaceProduct.name,
          marketplacePrice: prevMarketplaceProduct.price,
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
  },
  [
    relatedEntitiesExist(
      c => c.cartRepo,
      p => p.cartId,
      p => (_, path) => {
        return _.and(_.eq(path('productsRequestId'), p.productsRequestId), _.eq(path('productsInStock', 'data', '[]', 'hash'), p.hash))
      }
    ),
  ]
)
