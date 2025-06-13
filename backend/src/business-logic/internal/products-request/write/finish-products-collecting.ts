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

      return false
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
            productsInStock: [],
            productsAreOutOfStock: [],
            totalPrice: 0,
          }
        }

        const cart = shopIdToCartMap[shop.id]

        cart.productsInStock.push({
          name: presentProduct.products[0].name,
          quantity: collectedProduct.quantity,
          priceCategory: collectedProduct.priceCategory,
          price: presentProduct.products[0].price,
        })

        cart.totalPrice += presentProduct.products[0].price * collectedProduct.quantity

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
            productsInStock: [],
            productsAreOutOfStock: [],
            totalPrice: 0,
          }
        }

        const cart = shopIdToCartMap[shop.id]

        cart.productsAreOutOfStock.push({
          name: absentProduct.queryName,
          quantity: collectedProduct.quantity,
          priceCategory: collectedProduct.priceCategory,
        })
      }
    })

    const cartsForPreparing = Object.values(shopIdToCartMap)

    cartsForPreparing.forEach(cart => {
      if (!cart.productsInStock.length) {
        delete shopIdToCartMap[cart.shopId]
      }
    })

    const carts = Object.values(shopIdToCartMap)

    carts.sort((a, b) => {
      if (a.productsAreOutOfStock.length < b.productsAreOutOfStock.length) {
        return -1
      }

      if (a.productsAreOutOfStock.length > b.productsAreOutOfStock.length) {
        return 1
      }

      if (a.totalPrice < b.totalPrice) {
        return -1
      }

      if (a.totalPrice > b.totalPrice) {
        return 1
      }

      return 0
    })

    await execute(updateProductsRequest, { id: productsRequest.id, status: 'productsCollected', carts })

    return true
  }
)
