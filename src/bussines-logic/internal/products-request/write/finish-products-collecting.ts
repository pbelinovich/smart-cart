import { buildWriteOperation } from '../../../common/write'
import { getProductsRequestById } from '../read'
import { updateProductsRequest } from './update-products-request'
import { IAbsentProductEntity, ICart, ICollectedProduct, IPresentProductEntity, IShop } from '../../../external'
import { getPresentProductsByHashes } from '../../present-product'
import { getAbsentProductsByHashes } from '../../absent-product'
import { getShopsList } from '../../shop'

export interface IFinishProductsCollectingParams {
  productsRequestId: string
  collectedProducts?: ICollectedProduct[]
}

export const finishProductsCollecting = buildWriteOperation(
  async (_, { productsRequestId, collectedProducts }: IFinishProductsCollectingParams, { execute }) => {
    const productsRequest = await execute(getProductsRequestById, { id: productsRequestId })

    if (
      !productsRequest ||
      productsRequest.status !== 'productsCollecting' ||
      productsRequest.error ||
      !collectedProducts ||
      !collectedProducts.length
    ) {
      if (!productsRequest.error) {
        await execute(updateProductsRequest, { id: productsRequestId, error: true })
      }

      return
    }

    const hashes = collectedProducts.map(x => x.cachedProductHash)
    const [shops, presentProducts, absentProducts] = await Promise.all([
      execute(getShopsList, {}),
      execute(getPresentProductsByHashes, { hashes }),
      execute(getAbsentProductsByHashes, { hashes }),
    ])

    const shopIdToShopMap = shops.reduce<{ [shopId: string]: IShop }>((acc, shop) => {
      acc[shop.id] = shop
      return acc
    }, {})

    const hashToPresentProductMap = presentProducts.reduce<{
      [hash: string]: IPresentProductEntity
    }>((acc, product) => {
      acc[product.hash] = product
      return acc
    }, {})

    const hashToAbsentProductMap = absentProducts.reduce<{ [hash: string]: IAbsentProductEntity }>((acc, product) => {
      acc[product.hash] = product
      return acc
    }, {})

    const shopIdToCartMap: { [shopId: string]: ICart } = {}

    collectedProducts.forEach(collectedProduct => {
      const presentProduct = hashToPresentProductMap[collectedProduct.cachedProductHash]

      if (presentProduct) {
        const shop = shopIdToShopMap[presentProduct.shopId]

        if (!shop) {
          return
        }

        if (!shopIdToCartMap[shop.id]) {
          shopIdToCartMap[shop.id] = {
            shopId: shop.id,
            shopName: shop.name,
            products: [],
            totalPrice: 0,
          }
        }

        const cart = shopIdToCartMap[shop.id]

        cart.products.push({
          kind: 'inStock',
          name: presentProduct.productName,
          quantity: collectedProduct.quantity,
          priceCategory: collectedProduct.priceCategory,
          price: presentProduct.productPrice,
        })

        cart.totalPrice += presentProduct.productPrice

        return
      }

      const absentProduct = hashToAbsentProductMap[collectedProduct.cachedProductHash]

      if (absentProduct) {
        const shop = shopIdToShopMap[absentProduct.shopId]

        if (!shop) {
          return
        }

        if (!shopIdToCartMap[shop.id]) {
          shopIdToCartMap[shop.id] = {
            shopId: shop.id,
            shopName: shop.name,
            products: [],
            totalPrice: 0,
          }
        }

        const cart = shopIdToCartMap[shop.id]

        cart.products.push({
          kind: 'isOutOfStock',
          name: absentProduct.queryName,
          quantity: collectedProduct.quantity,
          priceCategory: collectedProduct.priceCategory,
        })
      }
    })

    const carts = Object.values(shopIdToCartMap)

    carts.forEach(cart => {
      cart.products.sort((a, b) => {
        if (a.kind === 'inStock' && b.kind === 'isOutOfStock') {
          return -1
        }

        if (a.kind === 'isOutOfStock' && b.kind === 'inStock') {
          return 1
        }

        return 0
      })
    })

    carts.sort((a, b) => {
      if (a.totalPrice < b.totalPrice) {
        return -1
      }

      if (a.totalPrice > b.totalPrice) {
        return 1
      }

      return 0
    })

    await execute(updateProductsRequest, { id: productsRequest.id, status: 'finishProductsCollecting', carts })
  }
)
