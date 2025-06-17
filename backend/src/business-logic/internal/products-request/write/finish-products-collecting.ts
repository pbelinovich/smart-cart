import { buildWriteOperation } from '../../../common/write'
import { getProductsRequestById } from '../read'
import { updateProductsRequest } from './update-products-request'
import { getPresentProductsByHashes } from '../../present-product'
import { getAbsentProductsByHashes } from '../../absent-product'
import { getShopsList } from '../../shop'
import { createCart } from '../../cart'
import {
  IAbsentProductEntity,
  ICollectedProduct,
  IPresentProductEntity,
  IShop,
  ProductInStock,
  ProductIsOutOfStock,
} from '../../../external'

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

    const hashes = collectedProducts.map(x => x.hash)
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

    const shopIdToProductsMap: { [shopId: string]: { inStock: ProductInStock[]; outOfStock: ProductIsOutOfStock[] } } = {}

    collectedProducts.forEach(collectedProduct => {
      const presentProduct = hashToPresentProductMap[collectedProduct.hash]

      if (presentProduct && presentProduct.marketplaceProducts.length) {
        const shop = shopIdToShopMap[presentProduct.shopId]
        const marketplaceProduct = presentProduct.marketplaceProducts[0]

        if (!shop) {
          return
        }

        if (!shopIdToProductsMap[shop.id]) {
          shopIdToProductsMap[shop.id] = { inStock: [], outOfStock: [] }
        }

        shopIdToProductsMap[shop.id].inStock.push({
          hash: presentProduct.hash,
          quantity: collectedProduct.quantity,
          priceCategory: collectedProduct.priceCategory,
          marketplaceId: marketplaceProduct.id,
          marketplaceName: marketplaceProduct.name,
          marketplacePrice: marketplaceProduct.price,
        })

        return
      }

      const absentProduct = hashToAbsentProductMap[collectedProduct.hash]

      if (!absentProduct) {
        return
      }

      const shop = shopIdToShopMap[absentProduct.shopId]

      if (!shop) {
        return
      }

      if (!shopIdToProductsMap[shop.id]) {
        shopIdToProductsMap[shop.id] = { inStock: [], outOfStock: [] }
      }

      shopIdToProductsMap[shop.id].outOfStock.push({
        hash: absentProduct.hash,
        quantity: collectedProduct.quantity,
        priceCategory: collectedProduct.priceCategory,
        queryName: absentProduct.queryName,
      })
    })

    await Promise.all(
      Object.keys(shopIdToProductsMap).map(shopId => {
        const shop = shopIdToShopMap[shopId]
        const products = shopIdToProductsMap[shopId]

        if (!shop || !products?.inStock.length) {
          return
        }

        return execute(createCart, {
          productsRequestId,
          shopId,
          shopName: shop.name,
          productsInStock: products.inStock,
          productsAreOutOfStock: products.outOfStock,
        })
      })
    )

    await execute(updateProductsRequest, { id: productsRequest.id, status: 'productsCollected' })

    return true
  }
)
